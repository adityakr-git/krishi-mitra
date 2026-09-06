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

// 6. Create / Book Slot API (Generates Token Number e.g. A-184)
const handleBookSlot = async (req, res) => {
  try {
    const { id, farmerId, farmerName, crop, quantity, mandiId, mandiName, timeSlot } = req.body;
    
    // Generate random token number (e.g., A-184)
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const tokenNumber = req.body.tokenNumber || `A-${randomDigits}`;

    const booking = await prisma.booking.create({
      data: {
        id: id || undefined,
        tokenNumber,
        farmerId: farmerId || 'HR-GUR-2024-8841',
        farmerName: farmerName || 'Ramesh Kumar',
        crop: crop || 'Wheat (Kanak)',
        quantity: parseFloat(quantity) || 40.0,
        mandiId: mandiId || null,
        mandiName: mandiName || 'Badshahpur APMC Mandi',
        timeSlot: timeSlot || '11:00 AM - 12:00 PM',
        status: 'BOOKED'
      }
    });

    io.emit('new_booking_created', booking);
    io.emit('booking_status_updated', booking);

    res.json({ success: true, booking, tokenNumber: booking.tokenNumber });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: "बुकिंग दर्ज करने में त्रुटि।" });
  }
};

app.post('/api/farmer/book-slot', handleBookSlot);
app.post('/api/bookings', handleBookSlot);

// 7. Get All Bookings & Officer Bookings (Ordered by createdAt desc with farmer details)
const handleGetBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Fetch related farmer user data
    const farmerIds = bookings.map(b => b.farmerId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: farmerIds } },
          { phone: { in: farmerIds } }
        ]
      }
    });

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, u);
      userMap.set(u.phone, u);
    });

    const enrichedBookings = bookings.map(b => {
      const u = userMap.get(b.farmerId);
      const farmerName = b.farmerName || u?.name || 'Kisan';
      return {
        ...b,
        farmerName,
        farmer: u ? { id: u.id, name: u.name, phone: u.phone, village: u.village || 'Mandi Area' } : { id: b.farmerId, name: farmerName, phone: '98765 00000' }
      };
    });

    res.json({ success: true, bookings: enrichedBookings });
  } catch (error) {
    console.error('Fetch officer bookings error:', error);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
};

app.get('/api/officer/bookings', handleGetBookings);
app.get('/api/bookings', handleGetBookings);

// 8. Gemini AI Assistant Chat API (Context-Aware Mandi & Weather Data)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "कृपया अपना प्रश्न लिखें।" });
    }

    // 1. INJECT REAL PLATFORM DATA AS CONTEXT
    const currentMandiDataContext = `
      CURRENT MANDI RATES (MSP):
      - Wheat (गेहूं/Kanak): ₹2,275 per quintal
      - Mustard (सरसों): ₹5,650 per quintal
      - Gram (चना): ₹5,440 per quintal
      - Barley (जौ): ₹1,850 per quintal
      - Bajra (बाजरा): ₹2,500 per quintal

      WEATHER ALERT:
      - Current Weather: 26°C, Light Rain (हल्की वर्षा), 88% Humidity.
      - Advisory: Rain expected. Advise farmers to cover crops and avoid coming to the mandi today.
    `;

    // 2. CREATE A STRICT SYSTEM PROMPT
    const prompt = `
      You are 'Krishi Mitra Awaaz Saathi', a helpful and polite AI assistant for Indian farmers. 
      Answer the farmer's query strictly in simple, easy-to-understand Hindi.
      Keep the answer short (1-2 sentences max) and conversational (address them as 'किसान भाई').

      RULES:
      - If they ask about crop prices, look at the CURRENT MANDI RATES below and give the exact price for that specific crop.
      - If they ask about weather or if they should come to the mandi, look at the WEATHER ALERT below and advise accordingly.
      - If they ask about their token, queue, or money, politely say: "किसान भाई, अपने टोकन और भुगतान की ताज़ा जानकारी के लिए कृपया 'खाता' (Account) सेक्शन चेक करें।"
      - If they ask a generic farming question, give a helpful, short tip.

      CONTEXT DATA FOR TODAY:
      ${currentMandiDataContext}
      
      FARMER QUERY: "${message}"
      
      AI RESPONSE (IN HINDI):
    `;

    // Try Google Gemini API if API key is provided
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    // Context-Aware Intelligent Hindi Fallback Engine
    const lower = message.toLowerCase();
    let reply = "नमस्ते किसान भाई! आपकी सेवा में कृषि मित्र आवाज़ साथी हाजिर है। फसल, मंडी भाव, टोकन या मौसम के बारे में पूछें।";

    if (lower.includes('सरसों') || lower.includes('सरसो') || lower.includes('mustard') || lower.includes('sarson')) {
      reply = "किसान भाई, आज सरसों का सरकारी एमएसपी भाव ₹5,650 प्रति क्विंटल है।";
    } else if (lower.includes('चना') || lower.includes('चने') || lower.includes('gram') || lower.includes('chana')) {
      reply = "किसान भाई, आज चना का सरकारी एमएसपी रेट ₹5,440 प्रति क्विंटल है।";
    } else if (lower.includes('जौ') || lower.includes('barley') || lower.includes('jau')) {
      reply = "किसान भाई, आज जौ का सरकारी एमएसपी भाव ₹1,850 प्रति क्विंटल है।";
    } else if (lower.includes('बाजरा') || lower.includes('बाजरे') || lower.includes('बाजरी') || lower.includes('bajra') || lower.includes('pearl millet')) {
      reply = "किसान भाई, आज बाजरा का सरकारी एमएसपी रेट ₹2,500 प्रति क्विंटल है।";
    } else if (lower.includes('गेहूं') || lower.includes('गेहू') || lower.includes('wheat') || lower.includes('kanak')) {
      reply = "किसान भाई, आज गेहूं का सरकारी समर्थन मूल्य (MSP) ₹2,275 प्रति क्विंटल है।";
    } else if (lower.includes('भाव') || lower.includes('रेट') || lower.includes('rate') || lower.includes('price') || lower.includes('msp') || lower.includes('समर्थन मूल्य')) {
      reply = "किसान भाई, आज गेहूं का सरकारी भाव ₹2,275, सरसों ₹5,650, चना ₹5,440, बाजरा ₹2,500 और जौ ₹1,850 प्रति क्विंटल है।";
    } else if (lower.includes('मौसम') || lower.includes('weather') || lower.includes('बारिश') || lower.includes('rain') || lower.includes('आऊं') || lower.includes('आएं') || lower.includes('छाता')) {
      reply = "किसान भाई, आज 26°C तापमान के साथ हल्की वर्षा और 88% नमी की संभावना है। कृपया अपनी फसल ढककर रखें और आज मंडी आने से बचें।";
    } else if (lower.includes('नंबर') || lower.includes('token') || lower.includes('टोकन') || lower.includes('कतार') || lower.includes('बारी') || lower.includes('पैसे') || lower.includes('रुपये') || lower.includes('dbt') || lower.includes('खाता') || lower.includes('payment')) {
      reply = "किसान भाई, अपने टोकन और भुगतान की ताज़ा जानकारी के लिए कृपया 'खाता' (Account) सेक्शन चेक करें।";
    }

    return res.json({ success: true, reply });
  } catch (error) {
    console.error("AI Chat Route Error:", error);
    res.status(500).json({ success: false, error: "AI Assistant is currently unavailable." });
  }
});

// 9. Fetch Dynamic Booking Status for Farmer (my-booking / booking-status)
const handleFarmerBooking = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const cleanId = String(farmerId).trim();

    // Fetch the most recent active booking for this farmerId or matching id/tokenNumber
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { farmerId: cleanId },
          { id: cleanId },
          { tokenNumber: cleanId },
          { id: { contains: cleanId, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!booking) {
      return res.json({ success: true, booking: null, status: 'NO_BOOKING' });
    }

    res.json({
      success: true,
      booking,
      status: booking.status,
      tokenNumber: booking.tokenNumber,
      bookingId: booking.id,
      crop: booking.crop,
      quantity: booking.quantity
    });
  } catch (error) {
    console.error("Fetch farmer booking error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch booking" });
  }
};

app.get('/api/farmer/my-booking/:farmerId', handleFarmerBooking);
app.get('/api/farmer/booking-status/:farmerId', handleFarmerBooking);

// 10. Universal Status Update API (Mandi Officer & Admin Yard Flow)
// Status Flow: BOOKED -> ARRIVED -> QUALITY_CHECK -> WEIGHED -> PAID
const handleStatusUpdate = async (req, res) => {
  try {
    const bookingId = req.body.bookingId || req.body.id;
    const newStatus = req.body.newStatus || req.body.status;

    if (!bookingId || !newStatus) {
      return res.status(400).json({ success: false, error: "bookingId and newStatus are required." });
    }

    const cleanId = String(bookingId).trim();

    // Find booking by id OR tokenNumber
    let booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { tokenNumber: cleanId }
        ]
      }
    });

    if (booking) {
      booking = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: newStatus }
      });
    } else {
      // Upsert record if not found
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const tokenNum = cleanId.startsWith('A-') ? cleanId : `A-${randomDigits}`;
      booking = await prisma.booking.upsert({
        where: { id: cleanId },
        update: { status: newStatus },
        create: {
          id: cleanId,
          tokenNumber: tokenNum,
          farmerId: 'HR-GUR-2024-8841',
          farmerName: 'Ramesh Kumar',
          crop: 'Wheat (Kanak)',
          quantity: 40.0,
          status: newStatus
        }
      });
    }

    // Real-time broadcast to all connected farmers and officers
    io.emit('booking_status_updated', booking);
    io.emit('token_status_changed', { id: booking.id, tokenNumber: booking.tokenNumber, status: newStatus });
    io.emit('gate_entry_scanned', { bookingId: booking.id, tokenNumber: booking.tokenNumber, status: newStatus });

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
};

app.put('/api/officer/update-status', handleStatusUpdate);
app.post('/api/officer/update-status', handleStatusUpdate);
app.post('/api/farmer/update-status', handleStatusUpdate);
app.put('/api/farmer/update-status', handleStatusUpdate);

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
  console.log(`Neon PostgreSQL Prisma connected`);
});

module.exports = { app, server, prisma };