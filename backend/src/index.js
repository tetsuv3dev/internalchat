const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const config = require('./config');
const { getDb, closeDb } = require('./database/db');
const { authenticateSocket } = require('./middleware/auth');
const { setupWebSocket } = require('./websocket/handler');
const authRouter = require('./auth/router');
const adminRouter = require('./auth/admin');
const channelsRouter = require('./channels/router');
const messagesRouter = require('./messages/router');

const app = express();
const server = http.createServer(app);

// Socket.io setup - allow any origin for IP-based access
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/channels', channelsRouter);
app.use('/api', messagesRouter);

// Serve frontend static files (built with `npm run build` in frontend/)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Socket.io authentication middleware
io.use(authenticateSocket);

// WebSocket handler
setupWebSocket(io);

// Initialize database
getDb();

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  closeDb();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  closeDb();
  server.close(() => process.exit(0));
});

// Listen on all interfaces (0.0.0.0) so it is reachable via IP
server.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${config.port}`);
  console.log(`Access via: http://<YOUR_IP>:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

module.exports = { app, server, io };
