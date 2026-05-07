const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { validateChannelName } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/channels - List user's channels
router.get('/', (req, res) => {
  const db = getDb();
  const channels = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
           CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
    FROM channels c
    LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
    WHERE c.is_public = 1 OR cm.user_id IS NOT NULL
    ORDER BY c.name
  `).all(req.user.id);

  res.json({ channels });
});

// POST /api/channels - Create channel
router.post('/', (req, res) => {
  const { name, description, isPublic } = req.body;

  const nameError = validateChannelName(name);
  if (nameError) {
    return res.status(400).json({ error: nameError });
  }

  const db = getDb();

  // Check if channel name exists
  const existing = db.prepare('SELECT id FROM channels WHERE name = ?').get(name);
  if (existing) {
    return res.status(409).json({ error: 'Channel name already taken' });
  }

  const channelId = uuidv4();
  const memberId = uuidv4();

  db.prepare(
    'INSERT INTO channels (id, name, description, is_public, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(channelId, name, description || '', isPublic !== false ? 1 : 0, req.user.id);

  // Creator auto-joins as admin
  db.prepare(
    'INSERT INTO channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)'
  ).run(memberId, channelId, req.user.id, 'admin');

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);

  res.status(201).json({ channel });
});

// GET /api/channels/:id - Get channel details
router.get('/:id', (req, res) => {
  const db = getDb();
  const channel = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count
    FROM channels c WHERE c.id = ?
  `).get(req.params.id);

  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  res.json({ channel });
});

// PUT /api/channels/:id - Update channel
router.put('/:id', (req, res) => {
  const { description, isPublic } = req.body;
  const db = getDb();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  // Check if user is admin of channel
  const membership = db.prepare(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ error: 'Only channel admins can update channel settings' });
  }

  db.prepare(
    'UPDATE channels SET description = COALESCE(?, description), is_public = COALESCE(?, is_public) WHERE id = ?'
  ).run(description, isPublic !== undefined ? (isPublic ? 1 : 0) : undefined, req.params.id);

  const updated = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  res.json({ channel: updated });
});

// DELETE /api/channels/:id - Delete channel
router.delete('/:id', (req, res) => {
  const db = getDb();

  const membership = db.prepare(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ error: 'Only channel admins can delete channels' });
  }

  db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);
  res.json({ message: 'Channel deleted' });
});

// POST /api/channels/:id/join - Join channel
router.post('/:id/join', (req, res) => {
  const db = getDb();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  if (!channel.is_public) {
    return res.status(403).json({ error: 'This channel is private' });
  }

  const existing = db.prepare(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (existing) {
    return res.status(400).json({ error: 'Already a member of this channel' });
  }

  const memberId = uuidv4();
  db.prepare(
    'INSERT INTO channel_members (id, channel_id, user_id) VALUES (?, ?, ?)'
  ).run(memberId, req.params.id, req.user.id);

  res.json({ message: 'Joined channel successfully' });
});

// POST /api/channels/:id/leave - Leave channel
router.post('/:id/leave', (req, res) => {
  const db = getDb();

  db.prepare(
    'DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);

  res.json({ message: 'Left channel' });
});

// GET /api/channels/:id/members - List members
router.get('/:id/members', (req, res) => {
  const db = getDb();

  const members = db.prepare(`
    SELECT u.id, u.nickname, u.last_active, cm.role, cm.joined_at
    FROM channel_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.channel_id = ?
    ORDER BY cm.role DESC, u.nickname
  `).all(req.params.id);

  res.json({ members });
});

module.exports = router;
