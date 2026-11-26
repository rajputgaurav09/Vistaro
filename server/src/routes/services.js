import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, optionalAuth, requireRole, logAudit } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/services - Public service catalogue (3 services)
router.get('/', (req, res) => {
  res.json({ services: db.get('service_catalog') });
});

// GET /api/v1/services/:slug - Service details
router.get('/:slug', (req, res) => {
  const service = db.findOne('service_catalog', s => s.slug === req.params.slug);
  if (!service) return res.status(404).json({ error: 'Service offering not found' });
  res.json({ service });
});

// POST /api/v1/services/requests - Customer submits service request form
router.post('/requests', authenticateToken, (req, res) => {
  const {
    service_slug,
    service_type,
    brief_details,
    target_audience,
    preferred_dates,
    location,
    budget_range,
    assets_link,
    contact_phone,
    additional_notes
  } = req.body;

  if (!service_slug || !brief_details) {
    return res.status(400).json({ error: 'Service selection and brief details are required.' });
  }

  const catalogItem = db.findOne('service_catalog', s => s.slug === service_slug);

  const newRequest = db.insert('service_requests', {
    customer_user_id: req.user.id,
    customer_name: req.user.name,
    customer_email: req.user.email,
    customer_phone: contact_phone || req.user.phone || '',
    service_type: service_type || (catalogItem ? catalogItem.name : service_slug),
    service_slug,
    brief_details,
    target_audience: target_audience || '',
    preferred_dates: preferred_dates || '',
    location: location || '',
    budget_range: budget_range || 'Quote requested',
    assets_link: assets_link || '',
    additional_notes: additional_notes || '',
    status: 'submitted',
    assigned_to_user_id: null,
    assigned_to_name: 'Unassigned',
    admin_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Notify admins
  const admins = db.find('users', u => u.role === 'admin');
  admins.forEach(adm => {
    db.insert('notifications', {
      user_id: adm.id,
      title: 'New Service Request',
      message: `${req.user.name} submitted a request for ${newRequest.service_type}`,
      type: 'service_update',
      read: false,
      link: `/admin/service-requests/${newRequest.id}`
    });
  });

  logAudit(req.user.id, req.user.name, 'SERVICE_REQUEST_SUBMITTED', 'service_request', newRequest.id, {
    service_type: newRequest.service_type
  });

  res.status(201).json({ message: 'Service request submitted successfully', request: newRequest });
});

// GET /api/v1/services/requests/mine - Customer views their requests
router.get('/requests/mine', authenticateToken, (req, res) => {
  const requests = db.find('service_requests', r => r.customer_user_id === req.user.id);

  const enriched = requests.map(r => {
    const quote = db.findOne('service_quotes', q => q.service_request_id === r.id);
    const milestones = db.find('service_milestones', m => m.service_request_id === r.id);
    return {
      ...r,
      quote,
      milestones
    };
  });

  res.json({ requests: enriched, count: enriched.length });
});

// GET /api/v1/services/requests/:id - Detailed request view
router.get('/requests/:id', authenticateToken, (req, res) => {
  const request = db.findById('service_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Service request not found' });

  // Permissions: Customer owner or Admin
  if (req.user.role !== 'admin' && request.customer_user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this service request' });
  }

  const quote = db.findOne('service_quotes', q => q.service_request_id === request.id);
  const milestones = db.find('service_milestones', m => m.service_request_id === request.id);

  res.json({
    request: {
      ...request,
      quote,
      milestones
    }
  });
});

// PATCH /api/v1/services/requests/:id/status - Update request status (Admin only)
router.patch('/requests/:id/status', authenticateToken, requireRole(['admin']), (req, res) => {
  const request = db.findById('service_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Service request not found' });

  const { status, admin_notes, assigned_to_user_id, assigned_to_name } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes;
  if (assigned_to_user_id !== undefined) updates.assigned_to_user_id = assigned_to_user_id;
  if (assigned_to_name !== undefined) updates.assigned_to_name = assigned_to_name;

  const updated = db.update('service_requests', request.id, updates);

  // Notify customer
  if (status && status !== request.status) {
    db.insert('notifications', {
      user_id: request.customer_user_id,
      title: `Service Request Status: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your request for ${request.service_type} is now ${status.replace('_', ' ')}.`,
      type: 'service_update',
      read: false,
      link: `/services/requests/${request.id}`
    });
  }

  logAudit(req.user.id, req.user.name, 'SERVICE_REQUEST_STATUS_UPDATED', 'service_request', request.id, updates);

  res.json({ message: 'Request updated', request: updated });
});

// POST /api/v1/services/requests/:id/quotes - Admin prepares and sends quote
router.post('/requests/:id/quotes', authenticateToken, requireRole(['admin']), (req, res) => {
  const request = db.findById('service_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Service request not found' });

  const { scope, deliverables, timeline, exclusions, price, currency, validity_date } = req.body;
  if (!scope || !price) {
    return res.status(400).json({ error: 'Scope and price are required for quotation.' });
  }

  let quote = db.findOne('service_quotes', q => q.service_request_id === request.id);

  if (quote) {
    quote = db.update('service_quotes', quote.id, {
      scope,
      deliverables: deliverables || [],
      timeline: timeline || 'To be scheduled upon confirmation',
      exclusions: exclusions || '',
      price: Number(price),
      currency: currency || 'INR',
      validity_date: validity_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  } else {
    quote = db.insert('service_quotes', {
      service_request_id: request.id,
      scope,
      deliverables: deliverables || [],
      timeline: timeline || 'To be scheduled upon confirmation',
      exclusions: exclusions || '',
      price: Number(price),
      currency: currency || 'INR',
      validity_date: validity_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
      sent_at: new Date().toISOString(),
      accepted_at: null
    });
  }

  // Update request status to 'quote_sent'
  db.update('service_requests', request.id, { status: 'quote_sent' });

  // Notify customer
  db.insert('notifications', {
    user_id: request.customer_user_id,
    title: 'Service Quote Received',
    message: `Vistaro has prepared an official quote for ${request.service_type}. Review terms and approve.`,
    type: 'service_update',
    read: false,
    link: `/services/requests/${request.id}`
  });

  // Create task for customer
  db.insert('tasks', {
    user_id: request.customer_user_id,
    title: `Review Quote for ${request.service_type}`,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'todo',
    priority: 'high',
    related_type: 'service_request',
    related_id: request.id
  });

  logAudit(req.user.id, req.user.name, 'SERVICE_QUOTE_CREATED', 'service_quote', quote.id, { price });

  res.status(201).json({ message: 'Quote generated and sent to customer', quote });
});

// POST /api/v1/services/quotes/:id/decision - Customer accepts or declines quote
router.post('/quotes/:id/decision', authenticateToken, (req, res) => {
  const quote = db.findById('service_quotes', req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const request = db.findById('service_requests', quote.service_request_id);
  if (!request) return res.status(404).json({ error: 'Associated service request not found' });

  if (req.user.role !== 'admin' && request.customer_user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to decide on this quote' });
  }

  const { decision, reason } = req.body; // 'accepted' or 'declined'
  if (!['accepted', 'declined'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be accepted or declined' });
  }

  const updatedQuote = db.update('service_quotes', quote.id, {
    status: decision,
    accepted_at: decision === 'accepted' ? new Date().toISOString() : null,
    decline_reason: reason || ''
  });

  const nextRequestStatus = decision === 'accepted' ? 'accepted' : 'declined';
  db.update('service_requests', request.id, { status: nextRequestStatus });

  // Create initial milestones if accepted
  if (decision === 'accepted') {
    db.insert('service_milestones', {
      service_request_id: request.id,
      title: 'Production Brief & Timeline Alignment',
      description: 'Initial kick-off meeting and schedule lock.',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      completed_at: null
    });
    db.insert('service_milestones', {
      service_request_id: request.id,
      title: 'Execution & Milestone Deliverables',
      description: 'Filming, campaign launch, or stage setup.',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      completed_at: null
    });
  }

  // Notify admins
  const admins = db.find('users', u => u.role === 'admin');
  admins.forEach(adm => {
    db.insert('notifications', {
      user_id: adm.id,
      title: `Service Quote ${decision.toUpperCase()}`,
      message: `${req.user.name} has ${decision} the quote for ${request.service_type}`,
      type: 'service_update',
      read: false,
      link: `/admin/service-requests/${request.id}`
    });
  });

  logAudit(req.user.id, req.user.name, 'SERVICE_QUOTE_DECISION', 'service_quote', quote.id, { decision });

  res.json({ message: `Quote marked as ${decision}`, quote: updatedQuote });
});

// POST /api/v1/services/requests/:id/milestones - Admin adds milestone
router.post('/requests/:id/milestones', authenticateToken, requireRole(['admin']), (req, res) => {
  const { title, description, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Milestone title is required' });

  const milestone = db.insert('service_milestones', {
    service_request_id: req.params.id,
    title,
    description: description || '',
    due_date: due_date || '',
    status: 'pending',
    completed_at: null
  });

  res.status(201).json({ message: 'Milestone added', milestone });
});

// PATCH /api/v1/services/milestones/:id - Admin updates milestone status
router.patch('/milestones/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const milestone = db.findById('service_milestones', req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const { status } = req.body;
  const updates = { status };
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const updated = db.update('service_milestones', milestone.id, updates);
  res.json({ message: 'Milestone updated', milestone: updated });
});

export default router;
