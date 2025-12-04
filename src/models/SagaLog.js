const mongoose = require('mongoose');

// Saga Log Schema - tracks the state of each step
const sagaLogSchema = new mongoose.Schema(
  {
    sagaId: {
      type: String,
      unique: true,
      required: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    orderId: {
      type: String,
      required: false,
      default: null,
    },
    customerId: {
      type: String,
      required: false,
    },
    productId: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
    totalPrice: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPENSATING', 'COMPENSATED'],
      default: 'STARTED',
    },
    steps: [
      {
        stepName: {
          type: String,
          enum: ['CREATE_ORDER', 'PROCESS_PAYMENT', 'UPDATE_INVENTORY', 'DELIVER_ORDER'],
        },
        status: {
          type: String,
          enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPENSATED'],
          default: 'PENDING',
        },
        timestamp: Date,
        error: String,
        compensationStatus: {
          type: String,
          enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SagaLog', sagaLogSchema);
