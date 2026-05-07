const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');

const router = express.Router();

// POST /api/admin/tokens/generate - Generate a registration token
router.post('/tokens/generate', (req, res) => {
  const db = getDb();
  const tokenId = uuidv4();
  const token = 'reg_' + crypto.randomBytes(24).toString('hex');
  const expiresInDays = req.body.expiresInDays || 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO registration_tokens (id, token, expires_at) VALUES (?, ?, ?)'
  ).run(tokenId, token, expiresAt);

  res.status(201).json({ token, expires_at: expiresAt });
});

// GET /api/admin/tokens - List registration tokens
router.get('/tokens', (req, res) => {
  const db = getDb();
  const tokens = db.prepare(
    'SELECT id, token, is_used, expires_at, created_at FROM registration_tokens ORDER BY created_at DESC LIMIT 50'
  ).all();

  res.json({ tokens });
});

module.exports = router;
