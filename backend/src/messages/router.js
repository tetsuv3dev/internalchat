const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// GET /api/channels/:channelId/messages - Fetch message history (paginated)
router.get('/channels/:channelId/messages', (req, res) => {
  const db = getDb();
  const { channelId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before; // cursor-based pagination

  // Check membership
  const membership = db.prepare(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).get(channelId, req.user.id);

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);

  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  if (!channel.is_public && !membership) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  let messages;
  if (before) {
    messages = db.prepare(`
      SELECT m.*, u.nickname as author_nickname
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.deleted_at IS NULL AND m.created_at < ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(channelId, before, limit);
  } else {
    messages = db.prepare(`
      SELECT m.*, u.nickname as author_nickname
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(channelId, limit);
  }

  // Reverse to get chronological order
  messages.reverse();

  const hasMore = messages.length === limit;

  res.json({ messages, hasMore });
});

// POST /api/channels/:channelId/messages - Send message
router.post('/channels/:channelId/messages', (req, res) => {
  const db = getDb();
  const { channelId } = req.params;
  const { content, contentType, codeLanguage } = req.body;

  const contentError = validateMessage(content);
  if (contentError) {
    return res.status(400).json({ error: contentError });
  }

  // Check membership
  const membership = db.prepare(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).get(channelId, req.user.id);

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  const messageId = uuidv4();
  const validContentTypes = ['text', 'code', 'video', 'file'];
  const type = validContentTypes.includes(contentType) ? contentType : 'text';

  db.prepare(
    'INSERT INTO messages (id, channel_id, user_id, content, content_type, code_language) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(messageId, channelId, req.user.id, content, type, codeLanguage || null);

  const message = db.prepare(`
    SELECT m.*, u.nickname as author_nickname
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(messageId);

  res.status(201).json({ message });
});

// PUT /api/messages/:id - Edit message
router.put('/messages/:id', (req, res) => {
  const db = getDb();
  const { content } = req.body;

  const contentError = validateMessage(content);
  if (contentError) {
    return res.status(400).json({ error: contentError });
  }

  const message = db.prepare('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL').get(req.params.id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (message.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Can only edit your own messages' });
  }

  db.prepare(
    'UPDATE messages SET content = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(content, req.params.id);

  const updated = db.prepare(`
    SELECT m.*, u.nickname as author_nickname
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(req.params.id);

  res.json({ message: updated });
});

// DELETE /api/messages/:id - Delete message
router.delete('/messages/:id', (req, res) => {
  const db = getDb();

  const message = db.prepare('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL').get(req.params.id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (message.user_id !== req.user.id) {
    // Check if user is channel admin
    const membership = db.prepare(
      'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ? AND role = ?'
    ).get(message.channel_id, req.user.id, 'admin');

    if (!membership) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }
  }

  db.prepare('UPDATE messages SET deleted_at = datetime(\'now\') WHERE id = ?').run(req.params.id);

  res.json({ message: 'Message deleted' });
});

module.exports = router;
