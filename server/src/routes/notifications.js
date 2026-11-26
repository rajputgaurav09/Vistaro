import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/notifications - Get notifications for user
router.get('/', authenticateToken, (req, res) => {
  const notifications = db.find('notifications', n => n.user_id === req.user.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ notifications, unread_count: unreadCount });
});

// PATCH /api/v1/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notif = db.findById('notifications', req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  if (notif.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const updated = db.update('notifications', notif.id, { read: true });
  res.json({ message: 'Marked as read', notification: updated });
});

// POST /api/v1/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', authenticateToken, (req, res) => {
  const notifications = db.find('notifications', n => n.user_id === req.user.id && !n.read);
  notifications.forEach(n => {
    db.update('notifications', n.id, { read: true });
  });

  res.json({ message: 'All notifications marked as read' });
});

export default router;
