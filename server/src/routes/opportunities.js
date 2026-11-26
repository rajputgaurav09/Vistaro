import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, optionalAuth, requireRole, logAudit } from '../middleware/auth.js';
import { validateRequest, createOpportunitySchema } from '../middleware/validate.js';

const router = express.Router();

// GET /api/v1/opportunities - Public discovery with search, filters & privacy enforcement
router.get('/', optionalAuth, (req, res) => {
  const { search, category, type, location, minBudget, maxBudget, status, personalized, visibility } = req.query;

  let opportunities = db.get('opportunities');

  // Filter by status (default published unless institution/admin requests all)
  if (status) {
    if (status !== 'all') {
      opportunities = opportunities.filter(o => o.status === status);
    }
  } else {
    // By default for public/vendor, only show published
    if (!req.user || req.user.role === 'vendor' || req.user.role === 'public_visitor') {
      opportunities = opportunities.filter(o => o.status === 'published');
    }
  }

  // Filter by privacy & permissions:
  // - Public / unauthenticated visitors: see only PUBLIC opportunities
  // - Admin: see all
  // - Institution: see PUBLIC + their own created private tenders
  // - Vendor: see PUBLIC + any private tenders where their organisation or email is invited
  if (!req.user) {
    opportunities = opportunities.filter(o => (o.visibility || 'PUBLIC') !== 'PRIVATE');
  } else if (req.user.role === 'admin') {
    // Admins see all
  } else if (req.user.role === 'institution') {
    opportunities = opportunities.filter(o =>
      (o.visibility || 'PUBLIC') !== 'PRIVATE' || o.organisation_id === req.user.organisation_id
    );
  } else if (req.user.role === 'vendor') {
    const myInvitations = db.find('tender_invitations', inv =>
      (inv.vendor_organisation_id === req.user.organisation_id ||
       (req.user.email && inv.invited_email && inv.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
      inv.status !== 'REVOKED'
    );
    const invitedOppIds = new Set(myInvitations.map(i => i.opportunity_id));
    opportunities = opportunities.filter(o =>
      (o.visibility || 'PUBLIC') !== 'PRIVATE' || invitedOppIds.has(o.id)
    );
  } else {
    opportunities = opportunities.filter(o => (o.visibility || 'PUBLIC') !== 'PRIVATE');
  }

  // Explicit visibility filter (e.g. ?visibility=PRIVATE or ?visibility=PUBLIC)
  if (visibility && visibility !== 'all') {
    opportunities = opportunities.filter(o => (o.visibility || 'PUBLIC') === visibility);
  }

  // Keyword search
  if (search) {
    const q = search.toLowerCase();
    opportunities = opportunities.filter(o =>
      o.title.toLowerCase().includes(q) ||
      o.scope.toLowerCase().includes(q) ||
      (o.organisation_name && o.organisation_name.toLowerCase().includes(q)) ||
      (o.location && o.location.toLowerCase().includes(q)) ||
      (o.category && o.category.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (category && category !== 'all') {
    opportunities = opportunities.filter(o => o.category === category || o.category?.toLowerCase() === category.toLowerCase());
  }

  // Type filter
  if (type && type !== 'all') {
    opportunities = opportunities.filter(o => o.type === type);
  }

  // Location filter
  if (location && location !== 'all') {
    const locLower = location.toLowerCase();
    opportunities = opportunities.filter(o => o.location && o.location.toLowerCase().includes(locLower));
  }

  // Budget range filter
  if (minBudget) {
    opportunities = opportunities.filter(o => o.budget_max >= Number(minBudget));
  }
  if (maxBudget) {
    opportunities = opportunities.filter(o => o.budget_min <= Number(maxBudget));
  }

  // Personalized feed logic
  let vendorProfile = null;
  let savedSet = new Set();
  let submittedSet = new Map();

  if (req.user) {
    const saved = db.find('saved_opportunities', s => s.user_id === req.user.id);
    saved.forEach(s => savedSet.add(s.opportunity_id));

    if (req.user.role === 'vendor' && req.user.organisation_id) {
      vendorProfile = db.findOne('vendor_profiles', vp => vp.organisation_id === req.user.organisation_id);
      const myProps = db.find('proposals', p => p.vendor_organisation_id === req.user.organisation_id);
      myProps.forEach(p => submittedSet.set(p.opportunity_id, p.status));
    }
  }

  const enriched = opportunities.map(opp => {
    let relevanceReason = null;
    let matchScore = 0;

    if (vendorProfile) {
      const catMatch = vendorProfile.service_categories?.some(cat =>
        opp.category.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(opp.category.toLowerCase())
      );
      if (catMatch) {
        relevanceReason = `Direct match with your service category (${opp.category})`;
        matchScore += 40;
      }

      const locMatch = vendorProfile.service_areas?.some(area =>
        opp.location.toLowerCase().includes(area.toLowerCase())
      );
      if (locMatch) {
        relevanceReason = relevanceReason ? `${relevanceReason} & your service area (${opp.location})` : `Matches your service area (${opp.location})`;
        matchScore += 30;
      }
    }

    // Check invitation status for vendors
    let invitationStatus = null;
    if (req.user && req.user.role === 'vendor') {
      const inv = db.findOne('tender_invitations', i =>
        i.opportunity_id === opp.id &&
        (i.vendor_organisation_id === req.user.organisation_id ||
         (req.user.email && i.invited_email && i.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
        i.status !== 'REVOKED'
      );
      if (inv) invitationStatus = inv.status;
    }

    return {
      ...opp,
      visibility: opp.visibility || 'PUBLIC',
      is_saved: savedSet.has(opp.id),
      my_proposal_status: submittedSet.get(opp.id) || null,
      my_invitation_status: invitationStatus,
      relevance_reason: relevanceReason,
      match_score: matchScore
    };
  });

  // If personalized requested, sort by matchScore desc
  if (personalized === 'true' && vendorProfile) {
    enriched.sort((a, b) => b.match_score - a.match_score);
  }

  res.json({ opportunities: enriched, count: enriched.length });
});

// GET /api/v1/opportunities/invited - Vendor view of all tenders they have been explicitly invited to
router.get('/invited', authenticateToken, requireRole(['vendor']), (req, res) => {
  const invitations = db.find('tender_invitations', inv =>
    (inv.vendor_organisation_id === req.user.organisation_id ||
     (req.user.email && inv.invited_email && inv.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
    inv.status !== 'REVOKED'
  );

  const enriched = invitations.map(inv => {
    const opp = db.findById('opportunities', inv.opportunity_id);
    if (!opp) return null;
    const org = db.findById('organisations', opp.organisation_id);
    const myProposal = db.findOne('proposals', p =>
      p.opportunity_id === opp.id && p.vendor_organisation_id === req.user.organisation_id
    );

    return {
      ...opp,
      visibility: opp.visibility || 'PUBLIC',
      organisation: org,
      invitation: inv,
      my_proposal_status: myProposal ? myProposal.status : null
    };
  }).filter(Boolean);

  res.json({ opportunities: enriched, count: enriched.length });
});

// GET /api/v1/opportunities/meta/categories
router.get('/meta/categories', (req, res) => {
  res.json({ categories: db.get('opportunity_categories') });
});

// GET /api/v1/opportunities/:id - Opportunity detail page with strict privacy check
router.get('/:id', optionalAuth, (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const visibility = opp.visibility || 'PUBLIC';

  // Strict Private Tender Enforcement (403 Forbidden for unauthorized access)
  if (visibility === 'PRIVATE') {
    if (!req.user) {
      return res.status(403).json({
        error: 'Access denied: This is a private tender accessible strictly by invitation.'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.role === 'institution' && opp.organisation_id === req.user.organisation_id;

    let hasInvitation = false;
    let vendorInvitation = null;

    if (req.user.role === 'vendor') {
      vendorInvitation = db.findOne('tender_invitations', inv =>
        inv.opportunity_id === opp.id &&
        (inv.vendor_organisation_id === req.user.organisation_id ||
         (req.user.email && inv.invited_email && inv.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
        inv.status !== 'REVOKED'
      );
      if (vendorInvitation) hasInvitation = true;
    }

    if (!isAdmin && !isOwner && !hasInvitation) {
      return res.status(403).json({
        error: 'Access denied: You are not invited to participate in this private tender.'
      });
    }
  }

  let isSaved = false;
  let myProposal = null;
  let myInvitation = null;

  if (req.user) {
    const saved = db.findOne('saved_opportunities', s => s.user_id === req.user.id && s.opportunity_id === opp.id);
    isSaved = !!saved;

    if (req.user.role === 'vendor' && req.user.organisation_id) {
      myProposal = db.findOne('proposals', p =>
        p.opportunity_id === opp.id && p.vendor_organisation_id === req.user.organisation_id
      );
      myInvitation = db.findOne('tender_invitations', inv =>
        inv.opportunity_id === opp.id &&
        (inv.vendor_organisation_id === req.user.organisation_id ||
         (req.user.email && inv.invited_email && inv.invited_email.toLowerCase() === req.user.email.toLowerCase())) &&
        inv.status !== 'REVOKED'
      );
    }
  }

  const org = db.findById('organisations', opp.organisation_id);

  // If institution owner or admin, include the full list of invitations
  let invitations = [];
  if (req.user && (req.user.role === 'admin' || (req.user.role === 'institution' && opp.organisation_id === req.user.organisation_id))) {
    invitations = db.find('tender_invitations', inv => inv.opportunity_id === opp.id).map(inv => {
      const vOrg = inv.vendor_organisation_id ? db.findById('organisations', inv.vendor_organisation_id) : null;
      return {
        ...inv,
        vendor_organisation: vOrg
      };
    });
  }

  res.json({
    opportunity: {
      ...opp,
      visibility,
      organisation: org,
      is_saved: isSaved,
      my_proposal: myProposal,
      my_invitation: myInvitation,
      invitations
    }
  });
});

// POST /api/v1/opportunities - Create opportunity (Institutions and Admins)
router.post('/', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const {
    title,
    category,
    type,
    scope,
    quantities,
    location,
    budget_min,
    budget_max,
    currency,
    is_budget_disclosed,
    submission_deadline,
    event_date,
    requirements,
    attachments,
    contact_details,
    visibility,
    initial_invitations,
    status
  } = req.body;

  if (!title || !category || !type || !scope || !location || !submission_deadline) {
    return res.status(400).json({ error: 'Missing mandatory fields: title, category, type, scope, location, and submission deadline are required' });
  }

  const org = db.findById('organisations', req.user.organisation_id);
  const tenderVisibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';

  const newOpp = db.insert('opportunities', {
    organisation_id: req.user.organisation_id,
    organisation_name: org ? org.name : req.user.name,
    title,
    category,
    type,
    scope,
    quantities: quantities || '',
    location,
    budget_min: Number(budget_min) || 0,
    budget_max: Number(budget_max) || 0,
    currency: currency || 'INR',
    is_budget_disclosed: is_budget_disclosed ?? true,
    publish_date: new Date().toISOString(),
    submission_deadline: new Date(submission_deadline).toISOString(),
    event_date: event_date || '',
    requirements: requirements && Array.isArray(requirements) ? requirements : [],
    attachments: attachments || [],
    contact_details: contact_details || `${req.user.name} | ${req.user.email}`,
    visibility: tenderVisibility,
    status: status || 'published',
    proposals_count: 0
  });

  // Handle initial invitations if provided (especially useful for Private Tenders)
  if (Array.isArray(initial_invitations) && initial_invitations.length > 0) {
    initial_invitations.forEach(invitee => {
      const email = typeof invitee === 'string' ? invitee.trim() : (invitee.vendor_email || invitee.email || '').trim();
      const orgId = typeof invitee === 'object' ? invitee.vendor_organisation_id : null;

      if (email || orgId) {
        db.insert('tender_invitations', {
          opportunity_id: newOpp.id,
          vendor_organisation_id: orgId || null,
          invited_email: email.toLowerCase(),
          status: 'INVITED',
          invited_at: new Date().toISOString()
        });

        // Notify vendor user if already registered
        const vendorUser = db.findOne('users', u =>
          (email && u.email.toLowerCase() === email.toLowerCase()) ||
          (orgId && u.organisation_id === orgId)
        );
        if (vendorUser) {
          db.insert('notifications', {
            user_id: vendorUser.id,
            title: 'New Tender Invitation',
            message: `You have been invited by ${org ? org.name : 'an Institution'} to bid on '${title}'`,
            type: 'invitation',
            read: false,
            link: `/opportunities/${newOpp.id}`
          });
        }
      }
    });
  }

  logAudit(req.user.id, req.user.name, 'OPPORTUNITY_CREATED', 'opportunity', newOpp.id, {
    title,
    visibility: tenderVisibility
  });

  res.status(201).json({ message: 'Opportunity created successfully', opportunity: newOpp });
});

// GET /api/v1/opportunities/:id/invitations - View invitations (Institution owner & Admin)
router.get('/:id/invitations', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to view invitations for this opportunity.' });
  }

  const invitations = db.find('tender_invitations', inv => inv.opportunity_id === opp.id).map(inv => {
    const vendorOrg = inv.vendor_organisation_id ? db.findById('organisations', inv.vendor_organisation_id) : null;
    const vendorProfile = inv.vendor_organisation_id ? db.findOne('vendor_profiles', vp => vp.organisation_id === inv.vendor_organisation_id) : null;
    return {
      ...inv,
      vendor_organisation: vendorOrg,
      vendor_profile: vendorProfile
    };
  });

  res.json({ opportunity: opp, invitations, count: invitations.length });
});

// POST /api/v1/opportunities/:id/invitations - Invite a vendor to tender
router.post('/:id/invitations', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to manage invitations for this opportunity.' });
  }

  const { vendor_email, vendor_organisation_id, notes } = req.body;
  if (!vendor_email && !vendor_organisation_id) {
    return res.status(400).json({ error: 'Vendor email or vendor organisation ID is required.' });
  }

  // Resolve vendor organisation or email if either is provided
  let targetOrgId = vendor_organisation_id || null;
  let targetEmail = (vendor_email || '').toLowerCase().trim();

  if (targetOrgId && !targetEmail) {
    const vendorUser = db.findOne('users', u => u.organisation_id === targetOrgId);
    if (vendorUser) targetEmail = vendorUser.email;
  } else if (!targetOrgId && targetEmail) {
    const vendorUser = db.findOne('users', u => u.email.toLowerCase() === targetEmail);
    if (vendorUser && vendorUser.organisation_id) {
      targetOrgId = vendorUser.organisation_id;
    }
  }

  // Check if invitation already exists
  const existing = db.findOne('tender_invitations', inv =>
    inv.opportunity_id === opp.id &&
    ((targetOrgId && inv.vendor_organisation_id === targetOrgId) ||
     (targetEmail && inv.invited_email && inv.invited_email.toLowerCase() === targetEmail)) &&
    inv.status !== 'REVOKED'
  );

  if (existing) {
    return res.status(400).json({ error: 'Vendor is already invited to this tender.', invitation: existing });
  }

  const invitation = db.insert('tender_invitations', {
    opportunity_id: opp.id,
    vendor_organisation_id: targetOrgId,
    invited_email: targetEmail,
    status: 'INVITED',
    notes: notes || '',
    invited_at: new Date().toISOString()
  });

  // Notify vendor user
  const vendorUser = db.findOne('users', u =>
    (targetEmail && u.email.toLowerCase() === targetEmail) ||
    (targetOrgId && u.organisation_id === targetOrgId)
  );

  if (vendorUser) {
    db.insert('notifications', {
      user_id: vendorUser.id,
      title: 'Private Tender Invitation',
      message: `${opp.organisation_name || 'An Institution'} has invited you to bid on '${opp.title}'`,
      type: 'invitation',
      read: false,
      link: `/opportunities/${opp.id}`
    });
  }

  logAudit(req.user.id, req.user.name, 'TENDER_INVITATION_CREATED', 'tender_invitation', invitation.id, {
    opportunity_id: opp.id,
    targetEmail,
    targetOrgId
  });

  const vendorOrg = targetOrgId ? db.findById('organisations', targetOrgId) : null;

  res.status(201).json({
    message: 'Vendor successfully invited to tender',
    invitation: {
      ...invitation,
      vendor_organisation: vendorOrg
    }
  });
});

// DELETE /api/v1/opportunities/:id/invitations/:invId - Revoke vendor invitation
router.delete('/:id/invitations/:invId', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to manage invitations for this opportunity.' });
  }

  const inv = db.findById('tender_invitations', req.params.invId);
  if (!inv || inv.opportunity_id !== opp.id) {
    return res.status(404).json({ error: 'Invitation not found' });
  }

  db.update('tender_invitations', inv.id, {
    status: 'REVOKED',
    revoked_at: new Date().toISOString()
  });

  logAudit(req.user.id, req.user.name, 'TENDER_INVITATION_REVOKED', 'tender_invitation', inv.id, {
    opportunity_id: opp.id
  });

  res.json({ message: 'Invitation revoked successfully' });
});

// PATCH /api/v1/opportunities/:id - Edit opportunity
router.patch('/:id', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'You do not have permission to modify this opportunity' });
  }

  const updated = db.update('opportunities', opp.id, req.body);
  logAudit(req.user.id, req.user.name, 'OPPORTUNITY_UPDATED', 'opportunity', opp.id, req.body);

  res.json({ message: 'Opportunity updated successfully', opportunity: updated });
});

// POST /api/v1/opportunities/:id/publish
router.post('/:id/publish', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to publish this opportunity' });
  }

  const updated = db.update('opportunities', opp.id, { status: 'published' });
  logAudit(req.user.id, req.user.name, 'OPPORTUNITY_PUBLISHED', 'opportunity', opp.id);
  res.json({ message: 'Opportunity published successfully', opportunity: updated });
});

// POST /api/v1/opportunities/:id/close
router.post('/:id/close', authenticateToken, requireRole(['institution', 'admin']), (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  if (req.user.role !== 'admin' && opp.organisation_id !== req.user.organisation_id) {
    return res.status(403).json({ error: 'Unauthorized to close this opportunity' });
  }

  const updated = db.update('opportunities', opp.id, { status: 'closed' });
  logAudit(req.user.id, req.user.name, 'OPPORTUNITY_CLOSED', 'opportunity', opp.id);
  res.json({ message: 'Opportunity closed', opportunity: updated });
});

// POST /api/v1/opportunities/:id/save - Save / bookmark
router.post('/:id/save', authenticateToken, (req, res) => {
  const opp = db.findById('opportunities', req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  const existing = db.findOne('saved_opportunities', s => s.user_id === req.user.id && s.opportunity_id === opp.id);
  if (existing) {
    return res.json({ message: 'Already saved', saved: existing });
  }

  const saved = db.insert('saved_opportunities', {
    user_id: req.user.id,
    opportunity_id: opp.id,
    notes: req.body.notes || '',
    saved_at: new Date().toISOString()
  });

  res.status(201).json({ message: 'Opportunity saved to your watchlist', saved });
});

// DELETE /api/v1/opportunities/:id/save - Unsave / unbookmark
router.delete('/:id/save', authenticateToken, (req, res) => {
  const existing = db.findOne('saved_opportunities', s => s.user_id === req.user.id && s.opportunity_id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Saved record not found' });
  }

  db.delete('saved_opportunities', existing.id);
  res.json({ message: 'Opportunity removed from your saved list' });
});

export default router;