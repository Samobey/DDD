require('dotenv').config();
const express = require('express');
const connectDB = require('../../config/database');
const orderRoutes = require('./routes');
const OutboxPublisher = require('../../utils/OutboxPublisher');

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB(MONGODB_URI);

// Routes
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Order Service is running' });
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
  console.log(`Order Service running on port ${PORT}`);
});
