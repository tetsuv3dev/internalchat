import { io, Socket } from 'socket.io-client';
import type { Message } from './api';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  // Connect to the same host the page was loaded from (works with any IP)
  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function sendMessage(channelId: string, content: string, contentType = 'text', codeLanguage?: string) {
  socket?.emit('message:send', { channelId, content, contentType, codeLanguage });
}

export function sendTyping(channelId: string) {
  socket?.emit('user:typing', { channelId });
}

export function joinChannel(channelId: string) {
  socket?.emit('channel:join', { channelId });
}

export function leaveChannel(channelId: string) {
  socket?.emit('channel:leave', { channelId });
}

export function onMessage(callback: (data: { message: Message }) => void) {
  socket?.on('message:receive', callback);
  return () => { socket?.off('message:receive', callback); };
}

export function onTyping(callback: (data: { userId: string; nickname: string; channelId: string }) => void) {
  socket?.on('user:typing', callback);
  return () => { socket?.off('user:typing', callback); };
}

export function onUserOnline(callback: (data: { userId: string; nickname: string; online: boolean }) => void) {
  socket?.on('user:online', callback);
  return () => { socket?.off('user:online', callback); };
}

export function onUserList(callback: (data: { users: Array<{ id: string; nickname: string }> }) => void) {
  socket?.on('user:list', callback);
  return () => { socket?.off('user:list', callback); };
}

export function onUserJoined(callback: (data: { userId: string; nickname: string; channelId: string }) => void) {
  socket?.on('user:joined', callback);
  return () => { socket?.off('user:joined', callback); };
}

export function onUserLeft(callback: (data: { userId: string; nickname: string; channelId: string }) => void) {
  socket?.on('user:left', callback);
  return () => { socket?.off('user:left', callback); };
}
