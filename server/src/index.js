import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Message } from './models/Message.js';

const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: clientUrl, methods: ['GET', 'POST'] } });

app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/messages', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const messages = await Message.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong.' });
});

io.on('connection', (socket) => {
  socket.on('message:send', async (payload, acknowledge) => {
    const author = typeof payload?.author === 'string' ? payload.author.trim().slice(0, 32) : '';
    const text = typeof payload?.text === 'string' ? payload.text.trim().slice(0, 1000) : '';

    if (!author || !text) {
      acknowledge?.({ ok: false, error: 'A name and message are required.' });
      return;
    }

    try {
      const message = await Message.create({ author, text });
      io.emit('message:new', message.toJSON());
      acknowledge?.({ ok: true });
    } catch (error) {
      console.error('Unable to save message:', error.message);
      // Allows a useful real-time demo if MongoDB is temporarily unavailable.
      const message = { _id: crypto.randomUUID(), author, text, createdAt: new Date().toISOString() };
      io.emit('message:new', message);
      acknowledge?.({ ok: true, transient: true });
    }
  });
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.warn(`MongoDB unavailable; live messages will not persist. (${error.message})`);
    }
  } else {
    console.warn('MONGODB_URI is not set; live messages will not persist.');
  }

  httpServer.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

start();
