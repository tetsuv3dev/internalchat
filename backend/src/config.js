const path = require('path');

const config = {
  port: parseInt(process.env.PORT || '3322', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '30m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'chat.db'),
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
