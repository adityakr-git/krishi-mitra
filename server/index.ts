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

// Initialize Socket.io with permissive CORS for development & production
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Krishi Mitra API & Real-Time Queue Hub',
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
  console.log(`[Socket.io] Client connected: ${socket.id}`);

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

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Krishi Mitra Backend running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io Real-Time Hub ready for Mandi queue updates`);
});

export default app;
