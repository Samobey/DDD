require('dotenv').config();
const express = require('express');
const connectDB = require('../../config/database');
const paymentRoutes = require('./routes');
const OutboxPublisher = require('../../utils/OutboxPublisher');

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB(MONGODB_URI);

// Routes
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment Service is running' });
});

// Start Outbox Publisher
const outboxPublisher = new OutboxPublisher(1000, 10);
outboxPublisher.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  outboxPublisher.stop();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
