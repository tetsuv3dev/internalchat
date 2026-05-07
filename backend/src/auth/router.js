const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { validateNickname } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register - Register with token
router.post('/register', (req, res) => {
  const { nickname, registrationToken } = req.body;

  const nicknameError = validateNickname(nickname);
  if (nicknameError) {
    return res.status(400).json({ error: nicknameError });
  }

  if (!registrationToken) {
    return res.status(400).json({ error: 'Registration token is required' });
  }

  const db = getDb();

  // Verify registration token
  const regToken = db.prepare(
    'SELECT * FROM registration_tokens WHERE token = ? AND is_used = 0 AND expires_at > datetime(\'now\')'
  ).get(registrationToken);

  if (!regToken) {
    return res.status(400).json({ error: 'Invalid or expired registration token' });
  }

  // Check if nickname exists
  const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname);
  if (existing) {
    return res.status(409).json({ error: 'Nickname already taken' });
  }

  const userId = uuidv4();
  const sessionId = uuidv4();
  const deviceId = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress;

  // Create user
  db.prepare('INSERT INTO users (id, nickname) VALUES (?, ?)').run(userId, nickname);

  // Mark registration token as used
  db.prepare('UPDATE registration_tokens SET is_used = 1, used_by = ? WHERE id = ?').run(userId, regToken.id);

  // Generate JWT
  const accessToken = jwt.sign({ userId, nickname }, config.jwtSecret, { expiresIn: config.jwtExpiry });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create session
  db.prepare(
    'INSERT INTO sessions (id, user_id, token, refresh_token, device_identifier, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(sessionId, userId, accessToken, refreshToken, deviceId, ip, expiresAt);

  // Auto-join general channel
  const generalChannel = db.prepare('SELECT id FROM channels WHERE name = \'general\' LIMIT 1').get();
  if (generalChannel) {
    const memberId = uuidv4();
    db.prepare(
      'INSERT OR IGNORE INTO channel_members (id, channel_id, user_id) VALUES (?, ?, ?)'
    ).run(memberId, generalChannel.id, userId);
  }

  res.status(201).json({
    user: { id: userId, nickname },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/login - Login with stored session/refresh token
router.post('/login', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const db = getDb();
  const session = db.prepare(
    'SELECT s.*, u.nickname FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token = ? AND s.expires_at > datetime(\'now\')'
  ).get(refreshToken);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Generate new JWT
  const accessToken = jwt.sign(
    { userId: session.user_id, nickname: session.nickname },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );

  // Update session token
  db.prepare('UPDATE sessions SET token = ? WHERE id = ?').run(accessToken, session.id);

  res.json({
    user: { id: session.user_id, nickname: session.nickname },
    accessToken,
    refreshToken: session.refresh_token,
  });
});

// POST /api/auth/refresh - Refresh session token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const db = getDb();
  const session = db.prepare(
    'SELECT s.*, u.nickname FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token = ? AND s.expires_at > datetime(\'now\')'
  ).get(refreshToken);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const accessToken = jwt.sign(
    { userId: session.user_id, nickname: session.nickname },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );

  const newRefreshToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'UPDATE sessions SET token = ?, refresh_token = ?, expires_at = ? WHERE id = ?'
  ).run(accessToken, newRefreshToken, expiresAt, session.id);

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  const db = getDb();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, nickname: req.user.nickname, last_active: req.user.last_active } });
});

module.exports = router;
