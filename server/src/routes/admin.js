import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin role
router.use(authenticateToken, requireRole(['admin']));

// GET /api/v1/admin/stats - Overview metrics
router.get('/stats', (req, res) => {
  const usersCount = db.get('users').length;
  const oppsCount = db.get('opportunities').length;
  const proposalsCount = db.get('proposals').length;
  const serviceRequestsCount = db.get('service_requests').length;
  const vendorsCount = db.get('vendor_profiles').length;

  res.json({
    stats: {
      total_users: usersCount,
      total_opportunities: oppsCount,
      total_proposals: proposalsCount,
      total_service_requests: serviceRequestsCount,
      total_vendors: vendorsCount
    }
  });
});

// GET /api/v1/admin/service-queue - Complete service request management queue
router.get('/service-queue', (req, res) => {
  const { status, service_slug } = req.query;
  let requests = db.get('service_requests');

  if (status && status !== 'all') {
    requests = requests.filter(r => r.status === status);
  }
  if (service_slug && service_slug !== 'all') {
    requests = requests.filter(r => r.service_slug === service_slug);
  }

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

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', (req, res) => {
  const logs = db.get('audit_logs');
  res.json({ logs: logs.slice(0, 50), count: logs.length });
});

// GET /api/v1/admin/users
router.get('/users', (req, res) => {
  const users = db.get('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    phone: u.phone,
    organisation_id: u.organisation_id,
    organisation: db.findById('organisations', u.organisation_id)
  }));
  res.json({ users });
});

export default router;
