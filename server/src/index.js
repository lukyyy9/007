// Main server entry point
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:19006",
      process.env.SOCKET_CORS_ORIGIN || "http://localhost:19006",
      "http://192.168.1.30:19006", // Allow Expo dev server
      /^http:\/\/192\.168\.\d+\.\d+:19006$/, // Allow any local network Expo dev server
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Import routes and swagger
const apiRoutes = require('./routes');
const { serve, setup } = require('./config/swagger');

// Swagger documentation
app.use('/api-docs', serve, setup);

// Basic health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Socket.IO connection handling
const SocketHandler = require('./socket');
const socketHandler = new SocketHandler(io);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces
server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

module.exports = { app, server, io };