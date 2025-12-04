const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../../models/Payment');
const SagaLog = require('../../models/SagaLog');
const Outbox = require('../../models/Outbox');
const { withTransaction } = require('../../utils/transaction');

const router = express.Router();

/**
 * Process Payment - Step 2 of the Saga
 * Calls Inventory Service next if successful
 * Requires idempotency-key for idempotent retries
 */
router.post('/process-payment', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  try {
    const { orderId, customerId, amount, sagaId } = req.body;

    if (!orderId || !customerId || !amount || !sagaId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing idempotency-key header',
      });
    }

    // Check if payment already processed
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment) {
      console.log(`[Payment Service] Payment already processed with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: existingPayment,
      });
    }

    // Get saga log to track progress
    let sagaLog = await SagaLog.findOne({ sagaId });
    
    if (!sagaLog) {
      console.error(`[Payment Service] SagaLog not found for sagaId: ${sagaId}`);
      return res.status(404).json({
        success: false,
        message: 'Saga not found',
      });
    }

    // Execute payment and outbox write without transaction for now
    try {
      // Re-fetch sagaLog to ensure we have the latest version
      sagaLog = await SagaLog.findOne({ sagaId });
      
      if (!sagaLog) {
        throw new Error('SagaLog not found');
      }
      
      // Simulate payment processing - randomly succeed or fail for demo
      const shouldFail = Math.random() < 0.1; // 10% failure rate for demo

      const status = shouldFail ? 'FAILED' : 'PROCESSED';

      const payment = new Payment({
        paymentId: uuidv4(),
        idempotencyKey,
        orderId,
        customerId,
        amount,
        sagaId,
        status,
      });

      await payment.save();

      // Update saga log
      const paymentStep = sagaLog.steps.find(s => s.stepName === 'PROCESS_PAYMENT');
      paymentStep.status = 'IN_PROGRESS';
      paymentStep.timestamp = new Date();
      await sagaLog.save();

      if (shouldFail) {
        console.log(`[Payment Service] Payment failed`);
        
        // Update saga log
        paymentStep.status = 'FAILED';
        paymentStep.error = 'Payment declined';
        await sagaLog.save();

        throw new Error('Payment declined');
      }

      console.log(`[Payment Service] Payment processed`);

      // Update saga log
      paymentStep.status = 'COMPLETED';
      await sagaLog.save();

      // Write inventory event to Outbox
      console.log(`[Payment Service] Writing inventory event to Outbox`);

      const inventoryEventId = uuidv4();
      const outboxEntry = new Outbox({
        eventId: inventoryEventId,
        aggregateId: orderId,
        eventType: 'PaymentProcessed',
        payload: {
          orderId,
          sagaId,
          productId: sagaLog.productId || 'unknown',
          quantity: sagaLog.quantity || 1,
        },
        targetService: 'inventory',
        targetEndpoint: '/inventories/update-inventory',
        published: false,
      });

      await outboxEntry.save();
      console.log(`[Payment Service] Inventory event written to Outbox: ${inventoryEventId}`);

      return { payment, outboxEntry };
    } catch (innerError) {
      throw innerError;
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed - inventory event queued',
    });

  } catch (error) {
    // Check if it's a duplicate key error from retry
    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
      console.log(`[Payment Service] Payment already exists for idempotency key: ${idempotencyKey}`);
      const existingPayment = await Payment.findOne({ idempotencyKey });
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: existingPayment,
      });
    }
    
    console.error('[Payment Service] Error processing payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
});

/**
 * Refund Payment - Compensate payment
 * Also requires idempotency-key for idempotent compensation
 */
router.post('/refund-payment', async (req, res) => {
  try {
    const { orderId, sagaId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!orderId || !sagaId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing idempotency-key header',
      });
    }

    const payment = await Payment.findOne({ orderId, sagaId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Mark as already refunded if compensation key matches
    if (payment.compensationKey === idempotencyKey) {
      console.log(`[Payment Service] Payment already refunded with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Payment already refunded',
        data: payment,
      });
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id },
      { 
        status: 'REFUNDED',
        compensationKey: idempotencyKey,
      },
      { new: true }
    );

    console.log(`[Payment Service] Payment refunded: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: updatedPayment,
    });
  } catch (error) {
    console.error('[Payment Service] Error refunding payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error refunding payment',
      error: error.message,
    });
  }
});

/**
 * Get Payment - Retrieve payment details
 */
router.get('/get-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('[Payment Service] Error fetching payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message,
    });
  }
});

async function _compensate(orderId, sagaId, sagaLog) {
  console.log(`[Payment Service] Starting compensation chain`);
  // Compensation will be handled by calling services
}

module.exports = router;
