import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ContextualAIAssistantService } from '../services/aiAssistantService.js';
import { db } from '../db/database.js';

const router = express.Router();

// POST /api/v1/assistant/messages - Query the contextual assistant
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query message cannot be empty' });
    }

    const response = await ContextualAIAssistantService.handleUserQuery(req.user, query, context);

    // Save message history in conversation log
    let conversation = db.findOne('ai_conversations', c => c.user_id === req.user.id);
    if (!conversation) {
      conversation = db.insert('ai_conversations', {
        user_id: req.user.id,
        title: 'Platform Guidance Session',
        created_at: new Date().toISOString()
      });
    }

    db.insert('ai_messages', {
      conversation_id: conversation.id,
      sender: 'user',
      content: query,
      created_at: new Date().toISOString()
    });

    db.insert('ai_messages', {
      conversation_id: conversation.id,
      sender: 'assistant',
      content: response.reply,
      references: response.references,
      suggested_actions: response.suggested_actions,
      created_at: new Date().toISOString()
    });

    res.json(response);
  } catch (err) {
    console.error('AI Assistant route error:', err);
    res.status(500).json({
      error: 'Contextual assistant is temporarily unable to process this query. Please try again.',
      fallback: true
    });
  }
});

// GET /api/v1/assistant/history - Retrieve recent assistant chat history
router.get('/history', authenticateToken, (req, res) => {
  const conversation = db.findOne('ai_conversations', c => c.user_id === req.user.id);
  if (!conversation) {
    return res.json({ messages: [] });
  }

  const messages = db.find('ai_messages', m => m.conversation_id === conversation.id);
  res.json({ messages: messages.slice(-20) });
});

export default router;
