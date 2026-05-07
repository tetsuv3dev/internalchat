const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Set test DB path before requiring anything else
const testDbPath = path.join(__dirname, '..', '..', 'data', 'test.db');
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

const { getDb, closeDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

describe('Auth Module', () => {
  let db;
  let registrationToken;

  before(() => {
    // Clean up old test db
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = getDb();

    // Create a registration token
    registrationToken = 'reg_' + crypto.randomBytes(24).toString('hex');
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO registration_tokens (id, token, expires_at) VALUES (?, ?, ?)').run(tokenId, registrationToken, expiresAt);

    // Create general channel
    const channelId = uuidv4();
    db.prepare('INSERT INTO channels (id, name, description, is_public) VALUES (?, ?, ?, 1)').run(channelId, 'general', 'General');
  });

  after(() => {
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create a user with valid registration token', () => {
    const userId = uuidv4();
    const nickname = 'testuser';

    // Verify token exists
    const token = db.prepare('SELECT * FROM registration_tokens WHERE token = ? AND is_used = 0').get(registrationToken);
    assert.ok(token, 'Registration token should exist');

    // Create user
    db.prepare('INSERT INTO users (id, nickname) VALUES (?, ?)').run(userId, nickname);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    assert.strictEqual(user.nickname, nickname);

    // Mark token as used
    db.prepare('UPDATE registration_tokens SET is_used = 1, used_by = ? WHERE token = ?').run(userId, registrationToken);
    const usedToken = db.prepare('SELECT * FROM registration_tokens WHERE token = ?').get(registrationToken);
    assert.strictEqual(usedToken.is_used, 1);
  });

  it('should generate valid JWT tokens', () => {
    const payload = { userId: 'test-id', nickname: 'testuser' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.userId, 'test-id');
    assert.strictEqual(decoded.nickname, 'testuser');
  });

  it('should reject expired JWT tokens', () => {
    const payload = { userId: 'test-id', nickname: 'testuser' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

    assert.throws(() => {
      jwt.verify(token, process.env.JWT_SECRET);
    }, { name: 'TokenExpiredError' });
  });

  it('should reject invalid JWT tokens', () => {
    assert.throws(() => {
      jwt.verify('invalid-token', process.env.JWT_SECRET);
    }, { name: 'JsonWebTokenError' });
  });

  it('should validate nicknames', () => {
    const { validateNickname } = require('../middleware/validate');
    assert.strictEqual(validateNickname('ab'), null); // valid
    assert.strictEqual(validateNickname('valid_user-1'), null); // valid
    assert.ok(validateNickname('')); // invalid
    assert.ok(validateNickname('a')); // too short
    assert.ok(validateNickname('user with spaces')); // invalid chars
    assert.ok(validateNickname('a'.repeat(31))); // too long
  });

  it('should validate messages', () => {
    const { validateMessage } = require('../middleware/validate');
    assert.strictEqual(validateMessage('hello'), null); // valid
    assert.ok(validateMessage('')); // empty
    assert.ok(validateMessage(null)); // null
    assert.ok(validateMessage('x'.repeat(10001))); // too long
  });
});
