# InternalChat

A lightweight, cross-platform real-time chat application built with Node.js, Express, Socket.io, React, and TailwindCSS. Runs directly via IP address -- no domain or Docker required.

## Features

- Real-time messaging via WebSocket (Socket.io)
- Channel-based message organization (public/private)
- Token-based authentication with server-generated registration tokens
- Code block sharing with syntax highlighting (10+ languages)
- Video sharing with embedded player
- Responsive design: mobile, tablet, desktop, ultrawide
- Typing indicators and online presence
- Message history with infinite scroll pagination
- Dark theme UI

## Tech Stack

**Backend:** Node.js, Express, Socket.io, better-sqlite3, JWT
**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, highlight.js

## Quick Start

### Prerequisites
- Node.js 20+

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Build the frontend

```bash
cd frontend
npm run build
```

### 3. Seed the database (first time only)

```bash
cd backend
npm run seed
```

This creates default channels and prints a registration token.

### 4. Start the server

```bash
cd backend
npm start
```

The app is now available at `http://<YOUR_IP>:3000`

### 5. Register

1. Open `http://<YOUR_IP>:3000` in any browser
2. Enter a nickname and the registration token from step 3
3. Start chatting

### Generate more registration tokens

```bash
curl -X POST http://<YOUR_IP>:3000/api/admin/tokens/generate
```

## Development

For local development with hot-reload:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend (proxies API to backend)
cd frontend && npm run dev
```

Frontend dev server runs on port 5173 and proxies `/api` and `/socket.io` to the backend on port 3000.

## Project Structure

```
internalchat/
  backend/
    src/
      auth/          # Authentication routes and admin
      channels/      # Channel management routes
      messages/      # Message CRUD routes
      websocket/     # Socket.io event handlers
      database/      # SQLite migration and seed
      middleware/    # Auth and validation middleware
      config.js      # Configuration
      index.js       # Server entry point (serves frontend)
  frontend/
    src/
      components/
        Auth/        # Login/registration screen
        Chat/        # Layout, sidebar, header, members
        Messages/    # Message display, code blocks, input
      lib/           # API client and socket utilities
      store/         # Zustand state management
      styles/        # TailwindCSS and highlight.js theme
  docs/
    API.md           # API documentation
```

## Responsive Breakpoints

| Screen | Width | Layout |
|--------|-------|--------|
| Mobile | < 640px | Single column, hamburger sidebar |
| Tablet | 640-1024px | Two-column |
| Desktop | 1024-2560px | Three-column with members panel |
| Ultrawide | > 2560px | Full layout with expanded panels |

## Environment Variables

See `backend/.env.example` for all configuration options. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | dev default | Change in production |
| `DB_PATH` | `./data/chat.db` | SQLite database path |

## API Documentation

See [docs/API.md](docs/API.md) for the complete API reference.
