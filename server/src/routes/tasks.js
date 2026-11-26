import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/tasks - Get tasks for the current user
router.get('/', authenticateToken, (req, res) => {
  const tasks = db.find('tasks', t => t.user_id === req.user.id);
  res.json({ tasks, count: tasks.length });
});

// POST /api/v1/tasks - Create custom task
router.post('/', authenticateToken, (req, res) => {
  const { title, due_date, priority, related_type, related_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const task = db.insert('tasks', {
    user_id: req.user.id,
    title,
    due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'todo',
    priority: priority || 'medium',
    related_type: related_type || null,
    related_id: related_id || null
  });

  res.status(201).json({ message: 'Task created', task });
});

// PATCH /api/v1/tasks/:id - Update task status
router.patch('/:id', authenticateToken, (req, res) => {
  const task = db.findById('tasks', req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to modify this task' });
  }

  const { status, title, due_date, priority } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (title) updates.title = title;
  if (due_date) updates.due_date = due_date;
  if (priority) updates.priority = priority;

  const updated = db.update('tasks', task.id, updates);
  res.json({ message: 'Task updated', task: updated });
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const task = db.findById('tasks', req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (task.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this task' });
  }

  db.delete('tasks', task.id);
  res.json({ message: 'Task deleted' });
});

export default router;
