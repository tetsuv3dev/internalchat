const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { validateMessage } = require('../middleware/validate');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();
// Track which channels each socket is in
const socketChannels = new Map();

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.nickname} (${socket.id})`);

    // Track online status
    if (!onlineUsers.has(user.id)) {
      onlineUsers.set(user.id, new Set());
    }
    onlineUsers.get(user.id).add(socket.id);

    // Auto-join user's channels
    const db = getDb();
    const memberships = db.prepare(
      'SELECT channel_id FROM channel_members WHERE user_id = ?'
    ).all(user.id);

    const channelIds = memberships.map((m) => m.channel_id);
    socketChannels.set(socket.id, new Set(channelIds));

    channelIds.forEach((channelId) => {
      socket.join(`channel:${channelId}`);
    });

    // Broadcast online status
    io.emit('user:online', {
      userId: user.id,
      nickname: user.nickname,
      online: true,
    });

    // Send list of online users
    const onlineList = [];
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.size > 0) {
        const u = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId);
        if (u) onlineList.push(u);
      }
    }
    socket.emit('user:list', { users: onlineList });

    // Handle sending messages via WebSocket
    socket.on('message:send', (data) => {
      const { channelId, content, contentType, codeLanguage } = data;

      const contentError = validateMessage(content);
      if (contentError) {
        return socket.emit('error', { message: contentError });
      }

      // Check membership
      const membership = db.prepare(
        'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?'
      ).get(channelId, user.id);

      if (!membership) {
        return socket.emit('error', { message: 'Not a member of this channel' });
      }

      const messageId = uuidv4();
      const validContentTypes = ['text', 'code', 'video', 'file'];
      const type = validContentTypes.includes(contentType) ? contentType : 'text';

      db.prepare(
        'INSERT INTO messages (id, channel_id, user_id, content, content_type, code_language) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(messageId, channelId, user.id, content, type, codeLanguage || null);

      const message = db.prepare(`
        SELECT m.*, u.nickname as author_nickname
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `).get(messageId);

      // Broadcast to channel
      io.to(`channel:${channelId}`).emit('message:receive', { message });
    });

    // Handle typing indicator
    socket.on('user:typing', (data) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('user:typing', {
        userId: user.id,
        nickname: user.nickname,
        channelId,
      });
    });

    // Handle joining a channel room
    socket.on('channel:join', (data) => {
      const { channelId } = data;
      socket.join(`channel:${channelId}`);
      const channels = socketChannels.get(socket.id) || new Set();
      channels.add(channelId);
      socketChannels.set(socket.id, channels);

      io.to(`channel:${channelId}`).emit('user:joined', {
        userId: user.id,
        nickname: user.nickname,
        channelId,
      });
    });

    // Handle leaving a channel room
    socket.on('channel:leave', (data) => {
      const { channelId } = data;
      socket.leave(`channel:${channelId}`);
      const channels = socketChannels.get(socket.id) || new Set();
      channels.delete(channelId);

      io.to(`channel:${channelId}`).emit('user:left', {
        userId: user.id,
        nickname: user.nickname,
        channelId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.nickname} (${socket.id})`);

      const userSockets = onlineUsers.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user.id);
          io.emit('user:online', {
            userId: user.id,
            nickname: user.nickname,
            online: false,
          });
        }
      }

      socketChannels.delete(socket.id);
    });
  });
}

module.exports = { setupWebSocket };
