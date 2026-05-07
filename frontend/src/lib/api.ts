const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  register: (nickname: string, registrationToken: string) =>
    apiRequest<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: { nickname, registrationToken },
    }),

  login: (refreshToken: string) =>
    apiRequest<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: { refreshToken },
    }),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: (token: string) =>
    apiRequest('/auth/logout', { method: 'POST', token }),

  me: (token: string) =>
    apiRequest<{ user: User }>('/auth/me', { token }),
};

// Channels API
export const channelsApi = {
  list: (token: string) =>
    apiRequest<{ channels: Channel[] }>('/channels', { token }),

  create: (token: string, name: string, description?: string, isPublic?: boolean) =>
    apiRequest<{ channel: Channel }>('/channels', {
      method: 'POST',
      token,
      body: { name, description, isPublic },
    }),

  get: (token: string, id: string) =>
    apiRequest<{ channel: Channel }>(`/channels/${id}`, { token }),

  join: (token: string, id: string) =>
    apiRequest('/channels/' + id + '/join', { method: 'POST', token }),

  leave: (token: string, id: string) =>
    apiRequest('/channels/' + id + '/leave', { method: 'POST', token }),

  members: (token: string, id: string) =>
    apiRequest<{ members: ChannelMember[] }>(`/channels/${id}/members`, { token }),
};

// Messages API
export const messagesApi = {
  list: (token: string, channelId: string, before?: string) =>
    apiRequest<{ messages: Message[]; hasMore: boolean }>(
      `/channels/${channelId}/messages${before ? `?before=${before}` : ''}`,
      { token }
    ),

  send: (token: string, channelId: string, content: string, contentType?: string, codeLanguage?: string) =>
    apiRequest<{ message: Message }>(`/channels/${channelId}/messages`, {
      method: 'POST',
      token,
      body: { content, contentType, codeLanguage },
    }),

  edit: (token: string, id: string, content: string) =>
    apiRequest<{ message: Message }>(`/messages/${id}`, {
      method: 'PUT',
      token,
      body: { content },
    }),

  delete: (token: string, id: string) =>
    apiRequest(`/messages/${id}`, { method: 'DELETE', token }),
};

// Admin API
export const adminApi = {
  generateToken: (expiresInDays?: number) =>
    apiRequest<{ token: string; expires_at: string }>('/admin/tokens/generate', {
      method: 'POST',
      body: { expiresInDays },
    }),
};

// Types
export interface User {
  id: string;
  nickname: string;
  last_active?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  is_public: number;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: number;
}

export interface ChannelMember {
  id: string;
  nickname: string;
  last_active: string;
  role: string;
  joined_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  content_type: string;
  code_language?: string;
  author_nickname: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}
