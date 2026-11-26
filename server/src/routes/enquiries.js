import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, logAudit } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/enquiries - List all enquiries for the authenticated user/org
router.get('/', authenticateToken, (req, res) => {
  const enquiries = db.find('vendor_enquiries', e =>
    e.sender_user_id === req.user.id ||
    e.sender_organisation_id === req.user.organisation_id ||
    e.vendor_organisation_id === req.user.organisation_id ||
    req.user.role === 'admin'
  );

  const enriched = enquiries.map(e => {
    const vendorOrg = db.findById('organisations', e.vendor_organisation_id);
    const senderOrg = db.findById('organisations', e.sender_organisation_id);
    return {
      ...e,
      vendor_organisation: vendorOrg,
      sender_organisation: senderOrg
    };
  });

  res.json({ enquiries: enriched, count: enriched.length });
});

// GET /api/v1/enquiries/:id
router.get('/:id', authenticateToken, (req, res) => {
  const enquiry = db.findById('vendor_enquiries', req.params.id);
  if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

  const isSender = enquiry.sender_user_id === req.user.id || enquiry.sender_organisation_id === req.user.organisation_id;
  const isRecipient = enquiry.vendor_organisation_id === req.user.organisation_id;
  const isAdmin = req.user.role === 'admin';

  if (!isSender && !isRecipient && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to view this enquiry' });
  }

  const vendorOrg = db.findById('organisations', enquiry.vendor_organisation_id);
  const senderOrg = db.findById('organisations', enquiry.sender_organisation_id);

  res.json({
    enquiry: {
      ...enquiry,
      vendor_organisation: vendorOrg,
      sender_organisation: senderOrg
    }
  });
});

// POST /api/v1/vendors/:vendorOrgId/enquiries - Send an enquiry or RFQ to a vendor
router.post('/vendor/:vendorOrgId', authenticateToken, (req, res) => {
  const { subject, message, requirements, budget_range, needed_by } = req.body;
  const vendorOrgId = req.params.vendorOrgId;

  const vendorOrg = db.findById('organisations', vendorOrgId);
  if (!vendorOrg) {
    return res.status(404).json({ error: 'Vendor organisation not found' });
  }

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const senderOrg = req.user.organisation_id ? db.findById('organisations', req.user.organisation_id) : null;

  const newEnquiry = db.insert('vendor_enquiries', {
    sender_organisation_id: req.user.organisation_id || 'individual',
    sender_user_id: req.user.id,
    sender_name: `${req.user.name} (${senderOrg ? senderOrg.name : 'Direct Buyer'})`,
    vendor_organisation_id: vendorOrgId,
    subject,
    message,
    requirements: requirements || '',
    budget_range: budget_range || '',
    needed_by: needed_by || '',
    status: 'open',
    responses: []
  });

  // Notify vendor members
  const vendorUsers = db.find('users', u => u.organisation_id === vendorOrgId);
  vendorUsers.forEach(vu => {
    db.insert('notifications', {
      user_id: vu.id,
      title: 'New Buyer Enquiry Received',
      message: `${req.user.name} sent an enquiry: "${subject}"`,
      type: 'enquiry',
      read: false,
      link: `/enquiries/${newEnquiry.id}`
    });
  });

  logAudit(req.user.id, req.user.name, 'VENDOR_ENQUIRY_SENT', 'vendor_enquiry', newEnquiry.id, { vendorOrgId, subject });

  res.status(201).json({ message: 'Enquiry sent to vendor successfully', enquiry: newEnquiry });
});

// POST /api/v1/enquiries/:id/reply - Reply to an enquiry thread
router.post('/:id/reply', authenticateToken, (req, res) => {
  const enquiry = db.findById('vendor_enquiries', req.params.id);
  if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message cannot be empty' });

  const isSender = enquiry.sender_user_id === req.user.id || enquiry.sender_organisation_id === req.user.organisation_id;
  const isRecipient = enquiry.vendor_organisation_id === req.user.organisation_id;
  const isAdmin = req.user.role === 'admin';

  if (!isSender && !isRecipient && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to reply to this enquiry' });
  }

  const responses = enquiry.responses || [];
  responses.push({
    id: `reply-${Date.now()}`,
    sender_id: req.user.id,
    sender_name: req.user.name,
    message,
    created_at: new Date().toISOString()
  });

  const updated = db.update('vendor_enquiries', enquiry.id, {
    responses,
    status: isRecipient ? 'replied' : enquiry.status
  });

  // Notify other party
  const recipientUserId = isSender ? null : enquiry.sender_user_id;
  if (recipientUserId) {
    db.insert('notifications', {
      user_id: recipientUserId,
      title: 'Reply on your Enquiry',
      message: `${req.user.name} replied to "${enquiry.subject}"`,
      type: 'enquiry',
      read: false,
      link: `/enquiries/${enquiry.id}`
    });
  }

  res.json({ message: 'Reply sent', enquiry: updated });
});

export default router;
