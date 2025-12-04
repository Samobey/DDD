require('dotenv').config();
const express = require('express');
const connectDB = require('../../config/database');
const inventoryRoutes = require('./routes');
const OutboxPublisher = require('../../utils/OutboxPublisher');

const app = express();
const PORT = process.env.INVENTORY_SERVICE_PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB(MONGODB_URI);

// Routes
app.use('/api/inventories', inventoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Inventory Service is running' });
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
  console.log(`Inventory Service running on port ${PORT}`);
});
