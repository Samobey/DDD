const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    aggregateId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'OrderCreated',
        'PaymentProcessed',
        'PaymentFailed',
        'InventoryUpdated',
        'InventoryFailed',
        'OrderShipped',
        'OrderDelivered',
        'OrderCompensated',
      ],
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    targetService: {
      type: String,
      required: true,
      enum: ['payment', 'inventory', 'shipping', 'order'],
    },
    targetEndpoint: {
      type: String,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishAttempts: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastError: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'outbox' }
);

// Index for finding unpublished events
outboxSchema.index({ published: 1, createdAt: 1 });
outboxSchema.index({ aggregateId: 1 });
outboxSchema.index({ eventType: 1 });

module.exports = mongoose.model('Outbox', outboxSchema);
