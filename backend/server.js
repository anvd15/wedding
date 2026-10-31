require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const setupWishSocket = require('./sockets/wishSocket');

const wishRoutes = require('./routes/wishRoutes');
const rsvpRoutes = require('./routes/rsvpRoutes');
const infoRoutes = require('./routes/infoRoutes');
const photoRoutes = require('./routes/photoRoutes');

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT'],
  },
});

// Lưu io vào express app để dùng trong controllers nếu cần
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/wishes', wishRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/photos', photoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Wedding Invitation API & WebSocket Server đang hoạt động tốt',
    timestamp: new Date().toISOString(),
  });
});

// Khởi tạo Socket.io handlers
setupWishSocket(io);

// Cổng chạy BE (mặc định 8080 theo yêu cầu)
const PORT = process.env.PORT || 8080;

// Kết nối DB và bắt đầu lắng nghe cổng
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`⚡ [Socket] WebSocket Server sẵn sàng trên cổng ${PORT}`);
  });
});
