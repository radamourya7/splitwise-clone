require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For MVP
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);

// Basic health route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Splitwise Clone API Running' });
});

// Real-time Chat Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinExpenseRoom', (expenseId) => {
    socket.join(`expense_${expenseId}`);
  });

  socket.on('sendMessage', (payload) => {
    io.to(`expense_${payload.expenseId}`).emit('receiveMessage', payload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
