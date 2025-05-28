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

// Real-time whiteboard collaboration
const whiteboardUsers = {}; 

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`User ${socket.id} (${username}) joined room ${roomId}`);

    if (!whiteboardUsers[roomId]) whiteboardUsers[roomId] = [];

    whiteboardUsers[roomId].push({ socketId: socket.id, username });

    // Send updated user list to everyone in the room
    io.to(roomId).emit('update-users', whiteboardUsers[roomId]);
  });

  socket.on('draw', ({ roomId, data }) => {
    socket.to(roomId).emit('draw', data);
  });

  socket.on('undo', ({ roomId }) => {
    socket.to(roomId).emit('undo');
  });

  socket.on('redo', ({ roomId, stroke }) => {
    socket.to(roomId).emit('redo', stroke);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    for (const roomId in whiteboardUsers) {
      const users = whiteboardUsers[roomId];
      const updatedUsers = users.filter(u => u.socketId !== socket.id);

      if (updatedUsers.length !== users.length) {
        whiteboardUsers[roomId] = updatedUsers;

        // Notify clients in the room about the updated user list
        io.to(roomId).emit('update-users', updatedUsers);
      }

      // Clean up empty room
      if (whiteboardUsers[roomId].length === 0) {
        delete whiteboardUsers[roomId];
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://192.168.0.104:${PORT}`);
});
