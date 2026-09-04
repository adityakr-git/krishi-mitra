import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { tokensRouter } from './routes/tokens';
import { queueRouter } from './routes/queue';
import { ratesRouter } from './routes/rates';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins for production (Firebase Hosting) and local development
const defaultAllowedOrigins = [
  'https://krishi-mitra-1c656.web.app',
  'https://krishi-mitra-1c656.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

// Add optional origins from environment variables (e.g. custom domain or preview URL)
const envOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean).flatMap(val => val!.split(',').map(s => s.trim()));

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const isOriginAllowed = (origin: string | undefined): boolean => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Support any Firebase Hosting preview/staging channel for this project
  if (origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  return false;
};

// Express CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize Socket.io with production-ready CORS for cross-domain HTTPS
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[Socket.io CORS] Blocked connection from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());

// Health Check Endpoint (Essential for Render deployment health probes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Krishi Mitra API & Real-Time Queue Hub',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/queue', queueRouter);
app.use('/api/rates', ratesRouter);

// Socket.io Real-Time Room Subscriptions
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

  // Farmer / Officer joins specific mandi room
  socket.on('join_mandi', (mandiId: string) => {
    const roomName = `mandi:${mandiId}`;
    socket.join(roomName);
    console.log(`[Socket.io] Socket ${socket.id} joined room ${roomName}`);
    socket.emit('joined_mandi', { room: roomName, status: 'CONNECTED' });
  });

  socket.on('leave_mandi', (mandiId: string) => {
    const roomName = `mandi:${mandiId}`;
    socket.leave(roomName);
    console.log(`[Socket.io] Socket ${socket.id} left room ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Render binds to process.env.PORT and requires 0.0.0.0 host
const PORT = Number(process.env.PORT) || 5001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Krishi Mitra Backend running on http://${HOST}:${PORT}`);
  console.log(`⚡ Socket.io Real-Time Hub ready for Mandi queue updates`);
  console.log(`🔒 Configured CORS Origins:`, allowedOrigins);
});

export default app;
