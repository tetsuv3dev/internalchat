import { create } from 'zustand';
import type { User, Channel, Message, ChannelMember } from '../lib/api';

interface OnlineUser {
  id: string;
  nickname: string;
}

interface TypingUser {
  userId: string;
  nickname: string;
  channelId: string;
  timestamp: number;
}

interface ChatStore {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;

  // Channels
  channels: Channel[];
  activeChannelId: string | null;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setActiveChannel: (id: string | null) => void;

  // Messages
  messages: Record<string, Message[]>;
  hasMore: Record<string, boolean>;
  addMessage: (message: Message) => void;
  setMessages: (channelId: string, messages: Message[], hasMore: boolean) => void;
  prependMessages: (channelId: string, messages: Message[], hasMore: boolean) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, channelId: string) => void;

  // Members
  members: Record<string, ChannelMember[]>;
  setMembers: (channelId: string, members: ChannelMember[]) => void;

  // Online users
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
  setUserOnline: (userId: string, nickname: string, online: boolean) => void;

  // Typing
  typingUsers: TypingUser[];
  setTyping: (userId: string, nickname: string, channelId: string) => void;

  // UI
  sidebarOpen: boolean;
  membersPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleMembersPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<ChatStore>((set, get) => ({
  // Auth
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },
  clearAuth: () => {
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, channels: [], messages: {}, activeChannelId: null });
  },

  // Channels
  channels: [],
  activeChannelId: null,
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  setActiveChannel: (id) => set({ activeChannelId: id }),

  // Messages
  messages: {},
  hasMore: {},
  addMessage: (message) => set((state) => {
    const channelMessages = state.messages[message.channel_id] || [];
    // Avoid duplicates
    if (channelMessages.some((m) => m.id === message.id)) return state;
    return {
      messages: {
        ...state.messages,
        [message.channel_id]: [...channelMessages, message],
      },
    };
  }),
  setMessages: (channelId, messages, hasMore) => set((state) => ({
    messages: { ...state.messages, [channelId]: messages },
    hasMore: { ...state.hasMore, [channelId]: hasMore },
  })),
  prependMessages: (channelId, messages, hasMore) => set((state) => ({
    messages: {
      ...state.messages,
      [channelId]: [...messages, ...(state.messages[channelId] || [])],
    },
    hasMore: { ...state.hasMore, [channelId]: hasMore },
  })),
  updateMessage: (message) => set((state) => {
    const channelMessages = state.messages[message.channel_id] || [];
    return {
      messages: {
        ...state.messages,
        [message.channel_id]: channelMessages.map((m) => m.id === message.id ? message : m),
      },
    };
  }),
  removeMessage: (messageId, channelId) => set((state) => ({
    messages: {
      ...state.messages,
      [channelId]: (state.messages[channelId] || []).filter((m) => m.id !== messageId),
    },
  })),

  // Members
  members: {},
  setMembers: (channelId, members) => set((state) => ({
    members: { ...state.members, [channelId]: members },
  })),

  // Online users
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setUserOnline: (userId, nickname, online) => set((state) => {
    if (online) {
      if (state.onlineUsers.some((u) => u.id === userId)) return state;
      return { onlineUsers: [...state.onlineUsers, { id: userId, nickname }] };
    }
    return { onlineUsers: state.onlineUsers.filter((u) => u.id !== userId) };
  }),

  // Typing
  typingUsers: [],
  setTyping: (userId, nickname, channelId) => set((state) => {
    const filtered = state.typingUsers.filter(
      (t) => !(t.userId === userId && t.channelId === channelId)
    );
    return {
      typingUsers: [...filtered, { userId, nickname, channelId, timestamp: Date.now() }],
    };
  }),

  // UI
  sidebarOpen: true,
  membersPanelOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMembersPanel: () => set((state) => ({ membersPanelOpen: !state.membersPanelOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
