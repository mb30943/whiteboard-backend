const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const boardsRouter = require('./controllers/board');
const syncUserRoutes = require('./controllers/authController');



const authenticateToken = require('./middleware/authMiddleware');
const pool = require('./db');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/boards', boardsRouter);
app.use('/api', syncUserRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Whiteboard backend is running');
});


// Protected Route Example
app.get('/api/protected', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  res.json({ message: `You are authenticated, user ${userId}` });
});

// WebSocket handling
const rooms = {};

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('draw', ({ roomId, data }) => {
    socket.to(roomId).emit('draw', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  socket.on('undo', ({ roomId }) => {
  socket.to(roomId).emit('undo');
});

socket.on('redo', ({ roomId, stroke }) => {
  socket.to(roomId).emit('redo', stroke);
});
});


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http:// 192.168.0.104:${PORT}`);
});