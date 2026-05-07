# InternalChat

A lightweight, cross-platform real-time chat application built with Node.js, Express, Socket.io, React, and TailwindCSS.

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
**DevOps:** Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Backend Setup

```bash
cd backend
npm install
npm run seed     # Creates default channels and a registration token
npm start        # Starts server on port 3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev      # Starts dev server on port 5173
```

### Docker Setup

```bash
docker-compose up --build
```

The app will be available at `http://localhost:5173`.

## Getting Started

1. Start the backend server
2. Generate a registration token:
   ```bash
   curl -X POST http://localhost:3001/api/admin/tokens/generate
   ```
3. Start the frontend
4. Enter your nickname and the registration token to join

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
      middleware/     # Auth and validation middleware
      config.js      # Configuration
      index.js       # Server entry point
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
  docker-compose.yml
```

## Responsive Breakpoints

| Screen | Width | Layout |
|--------|-------|--------|
| Mobile | < 640px | Single column, hamburger sidebar |
| Tablet | 640-1024px | Two-column |
| Desktop | 1024-2560px | Three-column with members panel |
| Ultrawide | > 2560px | Full layout with expanded panels |

## Environment Variables

See `backend/.env.example` for all configuration options.

## API Documentation

See [docs/API.md](docs/API.md) for the complete API reference.
