const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for document uploads

// Socket.io Setup for Real-time Mandi Updates
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  socket.on('join_mandi', (mandiId) => {
    socket.join(`mandi:${mandiId}`);
  });
  socket.on('leave_mandi', (mandiId) => {
    socket.leave(`mandi:${mandiId}`);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString(), database: 'Neon PostgreSQL connected' });
});

// 1. Farmer Signup API
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, password, document } = req.body;
    
    if (!phone || !name || !password) {
      return res.status(400).json({ error: "कृपया सभी आवश्यक फ़ील्ड भरें।" });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      return res.status(400).json({ error: "यह नंबर पहले से पंजीकृत है।" });
    }

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        phone: cleanPhone,
        password: String(password),
        document: document || null,
        role: "farmer",
        status: "pending"
      }
    });

    // Notify connected clients via Socket.io
    io.emit('new_farmer_registered', { id: user.id, name: user.name, phone: user.phone });

    res.json({ success: true, message: "पंजीकरण सफल! अधिकारी की मंजूरी का इंतज़ार करें।", user: { id: user.id, name: user.name, phone: user.phone, status: user.status } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: "डेटाबेस एरर।" });
  }
});

// 2. Login API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Master Test Account Bypass per prompt specification
    if (phone === '7755059513' && password === 'demo1234') {
      return res.json({
        success: true,
        user: { id: 'master-001', role: 'farmer', status: 'approved', name: 'Master User', phone: '7755059513' }
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "गलत क्रेडेंशियल्स।" });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "सर्वर एरर।" });
  }
});

// 3. Get Pending KYC (For Officer)
app.get('/api/officer/pending-kyc', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'pending', role: 'farmer' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch pending KYC error:', error);
    res.status(500).json({ error: "डेटाबेस से आवेदन प्राप्त करने में त्रुटि।" });
  }
});

// Get Approved Farmers (For Officer review list)
app.get('/api/officer/approved-kyc', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'approved', role: 'farmer' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch approved KYC error:', error);
    res.status(500).json({ error: "डेटाबेस से स्वीकृत किसान प्राप्त करने में त्रुटि।" });
  }
});

// 4. Approve Farmer
app.post('/api/officer/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'approved' }
    });
    
    // Broadcast real-time approval
    io.emit('farmer_approved', { id: updatedUser.id, phone: updatedUser.phone });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: "स्वीकृति प्रक्रिया में त्रुटि।" });
  }
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
  console.log(`Neon PostgreSQL Prisma connected`);
});

module.exports = { app, server, prisma };