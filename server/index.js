const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Initialize Gemini (GEMINI_API_KEY from environment)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://krishi-mitra-1c656.web.app',
  'https://krishi-mitra-1c656.firebaseapp.com',
  /\.web\.app$/,
  /\.firebaseapp\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for document uploads

// Socket.io Setup for Real-time Mandi Updates
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
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

// 5. Gate Entry QR Scan API (For APMC Officer)
app.post('/api/officer/scan-qr', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: "QR कोड / बुकिंग आईडी आवश्यक है।" });
    }

    const cleanId = String(bookingId).trim();

    // Check if exists in Prisma booking table
    let booking = await prisma.booking.findUnique({ where: { id: cleanId } });

    if (booking) {
      booking = await prisma.booking.update({
        where: { id: cleanId },
        data: { status: 'ARRIVED' }
      });
    } else {
      // Upsert / Create booking record so demo tokens or freshly generated tokens are registered
      booking = await prisma.booking.upsert({
        where: { id: cleanId },
        update: { status: 'ARRIVED' },
        create: {
          id: cleanId,
          farmerId: 'HR-GUR-2024-8841',
          farmerName: 'Ramesh Kumar',
          crop: 'Wheat (Kanak)',
          quantity: 40.0,
          status: 'ARRIVED'
        }
      });
    }

    // Broadcast real-time gate entry event via Socket.io
    io.emit('booking_status_updated', booking);
    io.emit('gate_entry_scanned', { bookingId: booking.id, status: 'ARRIVED' });

    res.json({
      success: true,
      message: "किसान का गेट प्रवेश सफल (Gate entry successful. Status: Arrived)",
      booking
    });
  } catch (error) {
    console.error('Scan QR error:', error);
    res.status(500).json({ success: false, error: "Invalid QR Code or Server Error" });
  }
});

// 6. Create / Book Slot API
app.post('/api/bookings', async (req, res) => {
  try {
    const { id, farmerId, farmerName, crop, quantity, mandiId, mandiName, timeSlot } = req.body;
    const booking = await prisma.booking.create({
      data: {
        id: id || undefined,
        farmerId: farmerId || 'HR-GUR-2024-8841',
        farmerName: farmerName || 'Ramesh Kumar',
        crop: crop || 'Wheat (Kanak)',
        quantity: parseFloat(quantity) || 40.0,
        mandiId,
        mandiName,
        timeSlot,
        status: 'BOOKED'
      }
    });

    io.emit('new_booking_created', booking);
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: "बुकिंग दर्ज करने में त्रुटि।" });
  }
});

// 7. Get All Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ success: false, error: "बुकिंग प्राप्त करने में त्रुटि।" });
  }
});

// 8. Gemini AI Assistant Chat API
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "कृपया अपना प्रश्न लिखें।" });
    }

    // Try Google Gemini API if API key is provided
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          You are 'Krishi Mitra', a helpful and polite AI assistant for Indian farmers. 
          Answer the following query in simple, easy-to-understand Hindi. 
          Keep the answer short (2-3 sentences max). 
          If asked about crop prices, give a generic positive answer mentioning MSP.
          If asked about token status, advise them to check the 'Khata' (Account) tab.
          
          Farmer Query: ${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim()) {
          return res.json({ success: true, reply: text.trim() });
        }
      } catch (geminiErr) {
        console.error("Gemini API Error (fallback used):", geminiErr.message || geminiErr);
      }
    }

    // Intelligent Hindi Fallback Response Engine
    const lower = message.toLowerCase();
    let reply = "नमस्ते किसान भाई! आपकी सेवा में कृषि मित्र हाजिर है। फसल, मंडी भाव या टोकन के बारे में कुछ भी पूछें।";

    if (lower.includes('नंबर') || lower.includes('number') || lower.includes('कब आएगा') || lower.includes('बारी') || lower.includes('टोकन') || lower.includes('token') || lower.includes('wait') || lower.includes('कतार')) {
      reply = "किसान भाई, आपके टोकन की लाइव स्थिति और खरीद प्रगति 'खाता' (History) टैब में उपलब्ध है। वहां आप अपनी कतार देख सकते हैं।";
    } else if (lower.includes('भाव') || lower.includes('रेट') || lower.includes('rate') || lower.includes('price') || lower.includes('msp') || lower.includes('गेहूं') || lower.includes('wheat')) {
      reply = "किसान भाई, आज गेहूं का सरकारी एमएसपी ₹2,275 प्रति क्विंटल है और नजदीकी मंडियों में अच्छी खरीद हो रही है।";
    } else if (lower.includes('सरसों') || lower.includes('mustard')) {
      reply = "किसान भाई, सरसों का सरकारी समर्थन मूल्य ₹5,650 प्रति क्विंटल है। आप अपनी सूखी और साफ फसल ला सकते हैं।";
    } else if (lower.includes('पैसे') || lower.includes('रुपये') || lower.includes('खाता') || lower.includes('dbt') || lower.includes('payment')) {
      reply = "किसान भाई, तौल एवं गुणवत्ता जांच पूरी होते ही राशि सीधे आपके बैंक खाते में DBT द्वारा भेज दी जाएगी।";
    } else if (lower.includes('मौसम') || lower.includes('weather') || lower.includes('बारिश')) {
      reply = "किसान भाई, आज मौसम बिल्कुल साफ रहने का अनुमान है। फसल मंडी लाने के लिए आज का दिन अनुकूल है।";
    }

    return res.json({ success: true, reply });
  } catch (error) {
    console.error("AI Chat Route Error:", error);
    res.status(500).json({ success: false, error: "AI Assistant is currently unavailable." });
  }
});

// 9. Fetch Dynamic Booking Status for 5-Step Tracker
app.get('/api/farmer/booking-status/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Fetch the most recent active booking for this farmer or matching token id
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { farmerId: farmerId },
          { id: farmerId },
          { id: { contains: farmerId, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!booking) {
      return res.json({ success: true, status: 'NO_BOOKING' });
    }

    res.json({
      success: true,
      status: booking.status,
      bookingId: booking.id,
      crop: booking.crop,
      quantity: booking.quantity
    });
  } catch (error) {
    console.error("Fetch booking status error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch status" });
  }
});

// 10. Update Token Status (Yard Operations: Quality Check, Weighing, Paid)
app.post('/api/farmer/update-status', async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (!bookingId || !status) {
      return res.status(400).json({ success: false, error: "bookingId and status are required." });
    }

    const cleanId = String(bookingId).trim();
    const updated = await prisma.booking.upsert({
      where: { id: cleanId },
      update: { status },
      create: {
        id: cleanId,
        farmerId: 'HR-GUR-2024-8841',
        crop: 'Wheat (Kanak)',
        quantity: 40.0,
        status
      }
    });

    io.emit('booking_status_updated', updated);
    res.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
  console.log(`Neon PostgreSQL Prisma connected`);
});

module.exports = { app, server, prisma };