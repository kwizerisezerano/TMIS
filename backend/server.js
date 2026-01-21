const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/applications'));
app.use('/api/tontines', require('./routes/tontines'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/penalties', require('./routes/penalties'));
app.use('/api/members', require('./routes/members'));

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-tontine', (tontineId) => {
    socket.join(`tontine-${tontineId}`);
    console.log(`User ${socket.id} joined tontine-${tontineId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Payment status polling for pending Lanari payments
setInterval(async () => {
  try {
    const [pendingPayments] = await pool.execute(
      `SELECT c.*, u.phone FROM contributions c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.payment_status = 'Pending' AND c.payment_method = 'mobile_money' 
       AND c.contribution_date > DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );

    for (const payment of pendingPayments) {
      // Check payment status with Lanari (if they provide status check endpoint)
      // For now, we'll simulate status updates after 2 minutes
      const paymentAge = Date.now() - new Date(payment.contribution_date).getTime();
      
      if (paymentAge > 120000) { // 2 minutes
        // Update to approved (simulate successful payment)
        await pool.execute(
          'UPDATE contributions SET payment_status = "Approved" WHERE id = ?',
          [payment.id]
        );
        
        // Emit success notification
        io.to(`tontine-${payment.tontine_id}`).emit('payment-status', {
          userId: payment.user_id,
          status: 'completed',
          message: 'Payment confirmed by Lanari Pay',
          transactionId: payment.transaction_ref,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Payment status check error:', error);
  }
}, 30000); // Check every 30 seconds

// Cleanup old notifications daily
setInterval(async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 5 DAY)'
    );
    
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} old notifications`);
    }
  } catch (error) {
    console.error('Notification cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily (24 hours)

// Make io available to routes
app.set('io', io);
app.set('db', pool);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, pool };