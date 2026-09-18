# PulseChat

A real-time MERN chat starter built with MongoDB, Express, React, Node.js, and Socket.IO.

## Quick start

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
2. Install all packages: `npm run install:all`
3. Start both apps: `npm run dev`
4. Open `http://localhost:5173` in two browser tabs to try live messaging.

The server uses port `5000`; the Vite client uses port `5173`. If no MongoDB connection is configured, the app still relays messages live but does not persist them.

## API

- `GET /api/health` — service status
- `GET /api/messages?limit=50` — latest persisted messages

## Next steps

- Add authentication (JWT or an auth provider) and replace the temporary display name.
- Add chat rooms and store a `roomId` on messages.
- Add message validation/rate limiting before production deployment.
