# InternalChat API Documentation

## Base URL
```
http://<YOUR_IP>:3322/api
```

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Register
`POST /api/auth/register`

Register a new user with a server-provided registration token.

**Request Body:**
```json
{
  "nickname": "username",
  "registrationToken": "reg_abc123..."
}
```

**Response (201):**
```json
{
  "user": { "id": "uuid", "nickname": "username" },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Login (via Refresh Token)
`POST /api/auth/login`

**Request Body:**
```json
{
  "refreshToken": "stored_refresh_token"
}
```

**Response (200):**
```json
{
  "user": { "id": "uuid", "nickname": "username" },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Refresh Token
`POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "stored_refresh_token"
}
```

### Logout
`POST /api/auth/logout` (Authenticated)

### Get Current User
`GET /api/auth/me` (Authenticated)

---

## Channel Endpoints (Authenticated)

### List Channels
`GET /api/channels`

### Create Channel
`POST /api/channels`
```json
{
  "name": "channel-name",
  "description": "optional description",
  "isPublic": true
}
```

### Get Channel
`GET /api/channels/:id`

### Update Channel
`PUT /api/channels/:id`

### Delete Channel
`DELETE /api/channels/:id`

### Join Channel
`POST /api/channels/:id/join`

### Leave Channel
`POST /api/channels/:id/leave`

### List Members
`GET /api/channels/:id/members`

---

## Message Endpoints (Authenticated)

### Get Messages (Paginated)
`GET /api/channels/:channelId/messages?before=<timestamp>&limit=50`

### Send Message
`POST /api/channels/:channelId/messages`
```json
{
  "content": "Hello world",
  "contentType": "text",
  "codeLanguage": null
}
```

Content types: `text`, `code`, `video`, `file`

### Edit Message
`PUT /api/messages/:id`

### Delete Message
`DELETE /api/messages/:id`

---

## Admin Endpoints

### Generate Registration Token
`POST /api/admin/tokens/generate`
```json
{
  "expiresInDays": 7
}
```

### List Registration Tokens
`GET /api/admin/tokens`

---

## WebSocket Events

Connect via Socket.io with authentication:
```javascript
const socket = io('http://<YOUR_IP>:3322', {
  auth: { token: accessToken }
});
```

### Client Events (emit)
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ channelId, content, contentType, codeLanguage }` | Send a message |
| `user:typing` | `{ channelId }` | Typing indicator |
| `channel:join` | `{ channelId }` | Join channel room |
| `channel:leave` | `{ channelId }` | Leave channel room |

### Server Events (listen)
| Event | Payload | Description |
|-------|---------|-------------|
| `message:receive` | `{ message }` | New message |
| `user:typing` | `{ userId, nickname, channelId }` | Typing indicator |
| `user:online` | `{ userId, nickname, online }` | User presence |
| `user:list` | `{ users }` | Online users list |
| `user:joined` | `{ userId, nickname, channelId }` | User joined channel |
| `user:left` | `{ userId, nickname, channelId }` | User left channel |
