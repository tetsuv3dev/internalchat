const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const migrate = require('./migrate');
const config = require('../config');

function seed() {
  const db = migrate(config.dbPath);

  // Create default general channel
  const generalId = uuidv4();
  const randomId = uuidv4();

  db.prepare(`
    INSERT OR IGNORE INTO channels (id, name, description, is_public)
    VALUES (?, 'general', 'General discussion channel', 1)
  `).run(generalId);

  db.prepare(`
    INSERT OR IGNORE INTO channels (id, name, description, is_public)
    VALUES (?, 'random', 'Random chat and off-topic', 1)
  `).run(randomId);

  // Generate a registration token
  const regToken = 'reg_' + crypto.randomBytes(24).toString('hex');
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO registration_tokens (id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(tokenId, regToken, expiresAt);

  console.log('Database seeded successfully.');
  console.log('Registration token:', regToken);
  console.log('Token expires at:', expiresAt);

  db.close();
}

seed();
