import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/opportunities/:oppId/readiness-assessments - Vendor views their readiness checklist
router.get('/opportunity/:oppId', authenticateToken, requireRole(['vendor']), (req, res) => {
  const opp = db.findById('opportunities', req.params.oppId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  let assessment = db.findOne('readiness_assessments', a =>
    a.opportunity_id === opp.id && a.vendor_id === req.user.organisation_id
  );

  // If none exists, generate an initial assessment template based on opportunity requirements
  if (!assessment) {
    const vendorProfile = db.findOne('vendor_profiles', vp => vp.organisation_id === req.user.organisation_id);

    const checklist_items = (opp.requirements || []).map(reqItem => {
      // Automatic heuristics for initial suggestion
      let status = 'needs_verification';
      let notes = 'Review your documentation and verify readiness before bid submission.';

      if (vendorProfile) {
        if (reqItem.title.toLowerCase().includes('gst') && vendorProfile.verified_status?.includes('Verified')) {
          status = 'ready';
          notes = 'GST and business credentials present in verified profile.';
        } else if (reqItem.title.toLowerCase().includes('experience') && vendorProfile.experience_years >= 5) {
          status = 'ready';
          notes = `${vendorProfile.experience_years} years experience registered in profile.`;
        }
      }

      return {
        req_id: reqItem.id,
        title: reqItem.title,
        mandatory: reqItem.mandatory,
        status, // 'ready' | 'missing_evidence' | 'not_met' | 'needs_verification'
        notes,
        evidence: ''
      };
    });

    const readyCount = checklist_items.filter(i => i.status === 'ready').length;
    const overall_readiness_pct = checklist_items.length ? Math.round((readyCount / checklist_items.length) * 100) : 0;

    assessment = db.insert('readiness_assessments', {
      opportunity_id: opp.id,
      vendor_id: req.user.organisation_id,
      overall_readiness_pct,
      checklist_items
    });
  }

  res.json({ assessment, opportunity: opp });
});

// POST /api/v1/opportunities/:oppId/readiness-assessments - Vendor updates checklist items
router.post('/opportunity/:oppId', authenticateToken, requireRole(['vendor']), (req, res) => {
  const opp = db.findById('opportunities', req.params.oppId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  const { checklist_items } = req.body;
  if (!checklist_items || !Array.isArray(checklist_items)) {
    return res.status(400).json({ error: 'checklist_items must be an array' });
  }

  const readyCount = checklist_items.filter(i => i.status === 'ready').length;
  const overall_readiness_pct = checklist_items.length ? Math.round((readyCount / checklist_items.length) * 100) : 0;

  let assessment = db.findOne('readiness_assessments', a =>
    a.opportunity_id === opp.id && a.vendor_id === req.user.organisation_id
  );

  if (assessment) {
    assessment = db.update('readiness_assessments', assessment.id, {
      checklist_items,
      overall_readiness_pct,
      updated_at: new Date().toISOString()
    });
  } else {
    assessment = db.insert('readiness_assessments', {
      opportunity_id: opp.id,
      vendor_id: req.user.organisation_id,
      checklist_items,
      overall_readiness_pct,
      updated_at: new Date().toISOString()
    });
  }

  res.json({ message: 'Readiness checklist updated', assessment });
});

export default router;
