# Cross-Platform Real-Time Chat System - Technical Specification

## Project Overview

Build a lightweight, cross-platform real-time chat application that works seamlessly across all devices, operating systems, and screen sizes. The system prioritizes performance, responsive design, and simplified authentication using server-generated tokens.

---

## Functional Requirements

### Core Features

1. **Real-Time Messaging**
   - Text message exchange with instant delivery
   - Support for multiple content types: plain text, code blocks, and media

2. **Channel System**
   - Create, join, and manage channels
   - Channel-based message organization
   - Support for public and private channels
   - Channel member management

3. **Content Support**
   - **Text Messages**: Plain text with markdown formatting
   - **Code Blocks**: Support for MD, JSON, Python, HTML, and other formats with syntax highlighting
   - **Video Sharing**: Embedded video player for video content
   - **File Attachments**: Code files and text content

4. **Persistent Memory**
   - Message history stored server-side
   - User preferences and settings persistence
   - Channel history and metadata
   - Automatic sync across devices

5. **User Authentication**
   - Simplified registration: IP, Port, Nickname, and server-generated token
   - Token-based authentication (no repeated login)
   - Device activation and management
   - Token expiration and refresh mechanisms

---

## Technical Stack (Recommended)

### Backend
- **Framework**: Deno with Fresh or Node.js with Fastify/Express
- **Real-Time Communication**: WebSocket (native) or Socket.io
- **Database**: PostgreSQL (primary) + Redis (caching & session management)
- **Message Queue**: BullMQ or similar for reliability
- **Authentication**: JWT with token generation and validation

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: TanStack Query + Zustand
- **Real-Time Updates**: Socket.io client or native WebSocket
- **UI Components**: shadcn/ui or Radix UI (already in your ecosystem)
- **Styling**: TailwindCSS with responsive utilities
- **Code Highlighting**: Highlight.js or Prism.js
- **Video Player**: video.js or React Player
- **Responsive Design**: Mobile-first approach with breakpoints for all screen sizes

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx or Caddy
- **Production Hosting**: Railway, Render, or self-hosted
- **Monitoring**: Sentry for error tracking, Prometheus for metrics

---

## System Architecture

### High-Level Flow

```
Client (Any Device/OS)
    ↓
WebSocket Connection (TLS/SSL)
    ↓
Server (Deno/Node.js)
    ├→ Authentication Service (JWT/Tokens)
    ├→ Message Service (WebSocket Handler)
    ├→ Channel Service (Management)
    └→ Persistence Layer (PostgreSQL + Redis)
```

### Authentication Flow

1. **Initial Setup**
   - User enters: `IP:PORT`, `NICKNAME`, and `REGISTRATION_TOKEN` (provided by server)
   - Client connects to server and sends credentials

2. **Server Validation**
   - Verify registration token (single-use or time-limited)
   - Create user session
   - Generate JWT or persistent session token
   - Return session token to client

3. **Subsequent Connections**
   - Client stores session token (localStorage or secure storage)
   - On reconnection, send stored token for instant access
   - No re-entry of credentials needed (until token expires)

4. **Device Management**
   - Track active sessions per device
   - Allow multi-device login
   - Option to revoke sessions

---

## Database Schema (Key Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  nickname VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP
);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Channel Members
CREATE TABLE channel_members (
  id UUID PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text', -- text, code, video, file
  code_language VARCHAR(50), -- for code blocks
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Sessions/Tokens
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) UNIQUE NOT NULL,
  device_identifier VARCHAR(255),
  ip_address INET,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Registration Tokens (server-generated)
CREATE TABLE registration_tokens (
  id UUID PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with token
- `POST /api/auth/login` - Login with stored session
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh session token
- `GET /api/auth/me` - Get current user

### Channels
- `GET /api/channels` - List user's channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel details
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel
- `POST /api/channels/:id/join` - Join channel
- `POST /api/channels/:id/leave` - Leave channel
- `GET /api/channels/:id/members` - List members

### Messages
- `GET /api/channels/:id/messages` - Fetch message history (paginated)
- `POST /api/channels/:id/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### WebSocket Events
- `message:send` - Send message in channel
- `message:receive` - Receive new message
- `channel:created` - New channel created
- `channel:updated` - Channel updated
- `user:joined` - User joined channel
- `user:left` - User left channel
- `user:typing` - User is typing indicator

---

## Frontend UI/UX Requirements

### Responsive Breakpoints

```
- Mobile (< 640px): Single column, stacked layout
- Tablet (640px - 1024px): Two-column layout
- Desktop (1024px - 2560px): Three-column layout
- Ultrawide (> 2560px): Four-column layout with sidebar
```

### Layout Structure

```
┌─────────────────────────────────────────┐
│         HEADER (Logo, User Menu)        │
├──────────┬──────────────┬────────────────┤
│ Channels │   Messages   │   User Info    │
│ Sidebar  │   Area       │   / Settings   │
│          │              │                │
│          │              │                │
├──────────┴──────────────┴────────────────┤
│    Message Input / Attachment Area      │
└─────────────────────────────────────────┘
```

### Mobile Optimization
- Hamburger menu for channel list
- Full-screen message view
- Touch-optimized buttons and inputs
- Collapsible sidebar
- Modal dialogs for actions

### Desktop Optimization
- Side-by-side panels with resizable dividers
- Rich context display (member list, channel info)
- Keyboard shortcuts
- Message search functionality

### Code Block Display
- Syntax highlighting with line numbers
- Copy-to-clipboard button
- Language identifier badge
- Scrollable container for long code

### Video Support
- Embedded video player
- Playback controls
- Fullscreen mode
- Supported formats: MP4, WebM, HLS streams

---

## Performance Optimization

1. **Network**
   - Message compression (gzip)
   - Lazy-load older messages (infinite scroll)
   - Batch WebSocket updates
   - Connection pooling

2. **Caching**
   - Client-side message caching (IndexedDB)
   - Redis server-side cache for frequently accessed data
   - Service Worker for offline support

3. **Rendering**
   - Virtual scrolling for large message lists
   - React.memo for message components
   - Debounced typing indicators
   - Image lazy-loading

4. **Storage**
   - Compress old messages server-side
   - Archive old channels
   - Database indexing on frequently queried fields

---

## Security Considerations

1. **Authentication**
   - JWT with short expiration (15-30 minutes)
   - Refresh tokens with longer expiration
   - HTTPS/TLS for all connections
   - Secure token storage (httpOnly cookies preferred)

2. **Authorization**
   - Role-based access control (Admin, Moderator, User)
   - Channel-level permissions
   - Message deletion limited to author/admin

3. **Data Protection**
   - Input sanitization (prevent XSS)
   - SQL injection prevention (prepared statements)
   - Rate limiting on API endpoints
   - CSRF tokens for state-changing requests

4. **Transport Security**
   - WSS (WebSocket Secure) for real-time connections
   - TLS 1.3+ for all HTTP connections
   - CORS properly configured

---

## Deployment Checklist

- [ ] Environment variables configured (.env files)
- [ ] Database migrations applied
- [ ] Registration tokens generated for initial setup
- [ ] SSL certificates installed
- [ ] Reverse proxy (Nginx) configured
- [ ] Redis service running
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] CDN for static assets (optional)
- [ ] Error tracking (Sentry) configured

---

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Backend API scaffolding
- Database setup
- Authentication system
- WebSocket infrastructure

### Phase 2: Core Features (Weeks 3-4)
- Message sending/receiving
- Channel management
- Persistent storage
- Session management

### Phase 3: Frontend (Weeks 5-6)
- Responsive UI components
- Real-time message display
- Channel interface
- User settings

### Phase 4: Advanced Features (Weeks 7-8)
- Code syntax highlighting
- Video player integration
- File attachments
- User presence indicators

### Phase 5: Polish & Deploy (Weeks 9-10)
- Performance optimization
- Security audit
- Testing (unit, integration, e2e)
- Deployment to production

---

## Initial Server Setup Commands

```bash
# Generate registration token
POST /api/admin/tokens/generate
Response: { "token": "reg_abc123xyz...", "expires_at": "2026-05-10T00:00:00Z" }

# Share with client:
# IP: 192.168.1.100
# Port: 3000
# Token: reg_abc123xyz...
# (Client enters nickname and completes registration)
```

---

## File Structure Example

```
chat-system/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── channels/
│   │   ├── messages/
│   │   ├── websocket/
│   │   ├── database/
│   │   └── middleware/
│   ├── tests/
│   ├── .env.example
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── Channels/
│   │   │   ├── Messages/
│   │   │   └── Auth/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   └── vite.config.ts
└── docs/
    └── API.md
```

---

## Success Metrics

- Load time: < 2 seconds on 3G
- Message delivery: < 500ms latency
- Uptime: 99.9%
- Responsive on devices from 320px to 5120px width
- Support 10,000+ concurrent users (scalable)
- Offline support with sync on reconnection

---

## Next Steps

1. **Backend Setup**: Initialize Node.js/Deno project with Express/Fastify
2. **Database**: Create PostgreSQL schema and seed initial data
3. **Frontend**: Set up React project with TailwindCSS
4. **Integration**: Connect frontend to WebSocket API
5. **Testing**: Implement comprehensive test suite
6. **Deployment**: Configure Docker and deployment pipeline
