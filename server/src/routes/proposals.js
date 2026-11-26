import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, logAudit } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/proposals/mine - Vendor sees all their own proposals
router.get('/mine', authenticateToken, requireRole(['vendor']), (req, res) => {
  const proposals = db.find('proposals', p => p.vendor_organisation_id === req.user.organisation_id);

  const enriched = proposals.map(p => {
    const opp = db.findById('opportunities', p.opportunity_id);
    return {
      ...p,
      opportunity: opp
    };
  });

  res.json({ proposals: enriched, count: enriched.length });
});

// GET /api/v1/opportunities/:oppId/proposals - Institution submission inbox for an opportunity
router.get('/opportunity/:oppId', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.oppId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  // Strictly enforce that only the owning institution or admin can view proposals
  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Confidentiality violation: You are not authorized to view submissions for this listing.' });
  }

  const proposals = db.find('proposals', p => p.opportunity_id === opp.id);

  // Enrich with vendor profile and evaluations
  const enriched = proposals.map(p => {
    const vendorOrg = db.findById('organisations', p.vendor_organisation_id);
    const vendorProfile = db.findOne('vendor_profiles', vp => vp.organisation_id === p.vendor_organisation_id);
    const evaluation = db.findOne('evaluations', e => e.proposal_id === p.id);

    return {
      ...p,
      vendor_organisation: vendorOrg,
      vendor_profile: vendorProfile,
      evaluation
    };
  });

  res.json({ opportunity: opp, proposals: enriched, count: enriched.length });
});

// GET /api/v1/proposals/:id - Proposal detail with strict confidentiality
router.get('/:id', authenticateToken, (req, res) => {
  const proposal = db.findById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const opp = db.findById('opportunities', proposal.opportunity_id);

  // Confidentiality Check:
  // Must be either:
  // 1. The vendor who created the proposal
  // 2. The institution that owns the opportunity
  // 3. Platform Admin
  const isVendorOwner = req.user.role === 'vendor' && proposal.vendor_organisation_id === req.user.organisation_id;
  const isInstitutionOwner = req.user.role === 'institution' && opp && opp.organisation_id === req.user.organisation_id;
  const isAdmin = req.user.role === 'admin';

  if (!isVendorOwner && !isInstitutionOwner && !isAdmin) {
    return res.status(403).json({
      error: 'Access denied: Competing vendor proposals and private evaluation details are strictly confidential.'
    });
  }

  const vendorOrg = db.findById('organisations', proposal.vendor_organisation_id);
  const evaluation = db.findOne('evaluations', e => e.proposal_id === proposal.id);

  res.json({
    proposal: {
      ...proposal,
      opportunity: opp,
      vendor_organisation: vendorOrg,
      evaluation: (isInstitutionOwner || isAdmin) ? evaluation : (evaluation ? { total_score: evaluation.total_score, status: evaluation.status } : null)
    }
  });
});

// POST /api/v1/opportunities/:oppId/proposals - Vendor submits/creates proposal
router.post('/opportunity/:oppId', authenticateToken, requireRole(['vendor']), (req, res) => {
  const opp = db.findById('opportunities', req.params.oppId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (opp.status === 'closed') {
    return res.status(400).json({ error: 'This opportunity is closed and is no longer accepting bids.' });
  }

  // If private tender, enforce that only invited vendors can submit proposals
  if ((opp.visibility || 'PUBLIC') === 'PRIVATE') {
    const isInvited = db.findOne('tender_invitations', inv =>
      inv.opportunity_id === opp.id &&
      (inv.vendor_organisation_id === req.user.organisation_id ||
       (req.user.email && inv.invited_email && inv.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
      inv.status !== 'REVOKED'
    );
    if (!isInvited) {
      return res.status(403).json({
        error: 'Access denied: You are not invited to submit a proposal for this private tender.'
      });
    }
  }

  // Check if vendor already submitted
  const existing = db.findOne('proposals', p =>
    p.opportunity_id === opp.id && p.vendor_organisation_id === req.user.organisation_id
  );
  if (existing) {
    return res.status(400).json({ error: 'Your organization has already submitted a proposal for this opportunity.', proposal: existing });
  }

  const { quote_amount, delivery_timeline, proposal_summary, breakdown, readiness_score } = req.body;
  if (!quote_amount || !delivery_timeline || !proposal_summary) {
    return res.status(400).json({ error: 'Quote amount, delivery timeline, and proposal summary are required.' });
  }

  const vendorOrg = db.findById('organisations', req.user.organisation_id);

  const newProposal = db.insert('proposals', {
    opportunity_id: opp.id,
    vendor_organisation_id: req.user.organisation_id,
    vendor_user_id: req.user.id,
    vendor_name: vendorOrg ? vendorOrg.name : req.user.name,
    quote_amount: Number(quote_amount),
    currency: opp.currency || 'INR',
    delivery_timeline,
    proposal_summary,
    breakdown: breakdown || [],
    status: 'submitted',
    readiness_score: Number(readiness_score) || 90,
    clarification_threads: [],
    institution_notes: '',
    submitted_at: new Date().toISOString()
  });

  // Increment opportunity proposals_count
  db.update('opportunities', opp.id, {
    proposals_count: (opp.proposals_count || 0) + 1
  });

  // Notify institution
  const institutionMembers = db.find('users', u => u.organisation_id === opp.organisation_id);
  institutionMembers.forEach(instUser => {
    db.insert('notifications', {
      user_id: instUser.id,
      title: 'New Proposal Received',
      message: `${vendorOrg ? vendorOrg.name : 'A vendor'} submitted a proposal for '${opp.title}'`,
      type: 'proposal',
      read: false,
      link: `/opportunities/${opp.id}/proposals`
    });
  });

  logAudit(req.user.id, req.user.name, 'PROPOSAL_SUBMITTED', 'proposal', newProposal.id, {
    opportunity_id: opp.id,
    quote_amount
  });

  res.status(201).json({ message: 'Proposal submitted successfully', proposal: newProposal });
});

// POST /api/v1/proposals/:id/clarification - Ask clarification (institution) or reply (vendor)
router.post('/:id/clarification', authenticateToken, (req, res) => {
  const proposal = db.findById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const opp = db.findById('opportunities', proposal.opportunity_id);
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message content is required' });

  const isVendorOwner = req.user.role === 'vendor' && proposal.vendor_organisation_id === req.user.organisation_id;
  const isInstitutionOwner = req.user.role === 'institution' && opp && opp.organisation_id === req.user.organisation_id;
  const isAdmin = req.user.role === 'admin';

  if (!isVendorOwner && !isInstitutionOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to communicate on this proposal' });
  }

  const threads = proposal.clarification_threads || [];
  const senderType = isVendorOwner ? 'vendor' : 'institution';

  const newClarification = {
    id: `clar-${Date.now()}`,
    sender: senderType,
    sender_name: `${req.user.name} (${req.user.role === 'vendor' ? 'Vendor' : 'Institution'})`,
    message,
    created_at: new Date().toISOString(),
    replied: senderType === 'vendor'
  };

  threads.push(newClarification);

  // Update proposal status if institution requested clarification
  let nextStatus = proposal.status;
  if (senderType === 'institution') {
    nextStatus = 'clarification_required';

    // Notify vendor
    db.insert('notifications', {
      user_id: proposal.vendor_user_id,
      title: 'Clarification Requested by Buyer',
      message: `${req.user.name} asked for clarification on your proposal for '${opp.title}'`,
      type: 'clarification',
      read: false,
      link: `/proposals/${proposal.id}`
    });

    // Create task for vendor
    db.insert('tasks', {
      user_id: proposal.vendor_user_id,
      title: `Respond to clarification on '${opp.title}'`,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'todo',
      priority: 'urgent',
      related_type: 'proposal',
      related_id: proposal.id
    });
  } else {
    // If vendor replied, change status back to under review / submitted
    nextStatus = 'submitted';

    // Notify institution members
    const instUsers = db.find('users', u => u.organisation_id === opp.organisation_id);
    instUsers.forEach(iu => {
      db.insert('notifications', {
        user_id: iu.id,
        title: 'Clarification Answer Received',
        message: `${req.user.name} responded to your clarification for '${opp.title}'`,
        type: 'clarification',
        read: false,
        link: `/opportunities/${opp.id}/proposals`
      });
    });
  }

  const updatedProposal = db.update('proposals', proposal.id, {
    clarification_threads: threads,
    status: nextStatus
  });

  logAudit(req.user.id, req.user.name, 'PROPOSAL_CLARIFICATION_SENT', 'proposal', proposal.id, { senderType });

  res.json({ message: 'Clarification thread updated', proposal: updatedProposal });
});

// POST /api/v1/proposals/:id/evaluations - Criterion-based review and scoring
router.post('/:id/evaluations', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const proposal = db.findById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const opp = db.findById('opportunities', proposal.opportunity_id);
  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to evaluate this proposal' });
  }

  const { criteria_scores, notes, status } = req.body;
  // criteria_scores e.g. { technical_compliance: 95, price_competitiveness: 90, equipment_caliber: 92, safety: 90 }
  const scores = Object.values(criteria_scores || {});
  const total_score = scores.length ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length) : 85;

  let evaluation = db.findOne('evaluations', e => e.proposal_id === proposal.id);
  if (evaluation) {
    evaluation = db.update('evaluations', evaluation.id, {
      criteria_scores,
      total_score,
      notes,
      status: status || 'in_review',
      evaluated_at: new Date().toISOString()
    });
  } else {
    evaluation = db.insert('evaluations', {
      proposal_id: proposal.id,
      reviewer_user_id: req.user.id,
      criteria_scores,
      total_score,
      notes,
      status: status || 'in_review',
      evaluated_at: new Date().toISOString()
    });
  }

  if (notes) {
    db.update('proposals', proposal.id, { institution_notes: notes });
  }

  logAudit(req.user.id, req.user.name, 'PROPOSAL_EVALUATED', 'evaluation', evaluation.id, { total_score });

  res.json({ message: 'Evaluation saved successfully', evaluation });
});

// POST /api/v1/proposals/:id/decision - Shortlist, Award, or Reject proposal
router.post('/:id/decision', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const proposal = db.findById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const opp = db.findById('opportunities', proposal.opportunity_id);
  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to record award decisions' });
  }

  const { decision, reason } = req.body;
  // decision: 'shortlisted' | 'awarded' | 'not_selected'
  if (!['shortlisted', 'awarded', 'not_selected'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decisions are: shortlisted, awarded, not_selected' });
  }

  const updatedProposal = db.update('proposals', proposal.id, {
    status: decision,
    decision_reason: reason || ''
  });

  if (decision === 'awarded') {
    // Mark opportunity as awarded
    db.update('opportunities', opp.id, { status: 'awarded' });

    // Mark other proposals as not_selected
    const otherProposals = db.find('proposals', p => p.opportunity_id === opp.id && p.id !== proposal.id);
    otherProposals.forEach(p => {
      db.update('proposals', p.id, { status: 'not_selected' });
      db.insert('notifications', {
        user_id: p.vendor_user_id,
        title: 'Opportunity Award Decision',
        message: `Evaluation concluded for '${opp.title}'. Another vendor was selected. Thank you for your bid.`,
        type: 'status_change',
        read: false,
        link: `/proposals/${p.id}`
      });
    });
  }

  // Notify vendor
  db.insert('notifications', {
    user_id: proposal.vendor_user_id,
    title: `Proposal Status: ${decision.toUpperCase()}`,
    message: `Your proposal for '${opp.title}' has been marked as ${decision.replace('_', ' ')}.`,
    type: 'status_change',
    read: false,
    link: `/proposals/${proposal.id}`
  });

  logAudit(req.user.id, req.user.name, 'PROPOSAL_DECISION_RECORDED', 'proposal', proposal.id, { decision, reason });

  res.json({ message: `Decision '${decision}' recorded successfully`, proposal: updatedProposal });
});

export default router;
