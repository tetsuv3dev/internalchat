const migrate = require('./migrate');
const config = require('../config');

let db = null;

function getDb() {
  if (!db) {
    db = migrate(config.dbPath);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
