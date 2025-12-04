const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Order = require('../../models/Order');
const SagaLog = require('../../models/SagaLog');
const Outbox = require('../../models/Outbox');
const { withTransaction } = require('../../utils/transaction');

const router = express.Router();

/**
 * Start Order Processing Saga - Entry Point
 * Initiates the choreography by creating order and calling payment service
 * Requires idempotency-key header for idempotent retries
 */
router.post('/start-saga', async (req, res) => {
  try {
    const { customerId, productId, quantity, totalPrice } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!customerId || !productId || !quantity || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, productId, quantity, totalPrice',
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing idempotency-key header',
      });
    }

    // Check if this saga was already started with this idempotency key
    let existingSaga = await SagaLog.findOne({ idempotencyKey });
    if (existingSaga) {
      console.log(`[Order Service] Saga already processed with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Saga already initiated',
        sagaId: existingSaga.sagaId,
        orderId: existingSaga.orderId,
      });
    }

    const sagaId = uuidv4();
    console.log(`\n[Order Service] Starting Saga: ${sagaId}`);

    // Execute all writes in a single transaction
    const { orderId, paymentEventId } = await withTransaction(async (session) => {
      // Initialize Saga Log with idempotency key
      const sagaLog = new SagaLog({
        sagaId,
        idempotencyKey,
        status: 'STARTED',
        customerId,
        productId,
        quantity,
        totalPrice,
        steps: [
          { stepName: 'CREATE_ORDER', status: 'PENDING' },
          { stepName: 'PROCESS_PAYMENT', status: 'PENDING' },
          { stepName: 'UPDATE_INVENTORY', status: 'PENDING' },
          { stepName: 'DELIVER_ORDER', status: 'PENDING' },
        ],
      });

      await sagaLog.save({ session });

      // Step 1: Create Order
      console.log(`[Order Service] Executing Step 1: CREATE_ORDER`);
      const orderId = uuidv4();
      const order = new Order({
        orderId,
        customerId,
        productId,
        quantity,
        totalPrice,
        sagaId,
        status: 'CONFIRMED',
      });

      await order.save({ session });
      console.log(`[Order Service] Order created: ${orderId}`);

      // Update saga log
      const orderStep = sagaLog.steps.find(s => s.stepName === 'CREATE_ORDER');
      orderStep.status = 'COMPLETED';
      orderStep.timestamp = new Date();
      sagaLog.orderId = orderId;
      await sagaLog.save({ session });

      // Write payment event to Outbox
      console.log(`[Order Service] Writing payment event to Outbox`);

      const paymentEventId = uuidv4();
      const outboxEntry = new Outbox({
        eventId: paymentEventId,
        aggregateId: orderId,
        eventType: 'OrderCreated',
        payload: {
          orderId,
          customerId,
          amount: totalPrice,
          sagaId,
        },
        targetService: 'payment',
        targetEndpoint: '/payments/process-payment',
        published: false,
      });

      await outboxEntry.save({ session });
      console.log(`[Order Service] Payment event written to Outbox: ${paymentEventId}`);

      // Update saga log
      const paymentStep = sagaLog.steps.find(s => s.stepName === 'PROCESS_PAYMENT');
      paymentStep.status = 'PENDING';
      paymentStep.timestamp = new Date();
      await sagaLog.save({ session });

      return { orderId, paymentEventId };
    });

    res.status(200).json({
      success: true,
      message: 'Order saga initiated successfully - events queued for processing',
      sagaId,
      orderId,
    });

  } catch (error) {
    console.error('[Order Service] Error starting saga:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error starting saga',
      error: error.message,
    });
  }
});

/**
 * Create Order (internal endpoint for other services)
 */
router.post('/create-order', async (req, res) => {
  try {
    const { customerId, productId, quantity, totalPrice, sagaId } = req.body;

    if (!customerId || !productId || !quantity || !totalPrice || !sagaId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const orderId = uuidv4();
    const order = new Order({
      orderId,
      customerId,
      productId,
      quantity,
      totalPrice,
      sagaId,
      status: 'CONFIRMED',
    });

    await order.save();
    console.log(`[Order Service] Order created: ${orderId}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('[Order Service] Error creating order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
});

/**
 * Compensate Order - Undo order creation
 */
router.post('/compensate-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderId',
      });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status: 'COMPENSATED' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    console.log(`[Order Service] Order compensated: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Order compensated successfully',
      data: order,
    });
  } catch (error) {
    console.error('[Order Service] Error compensating order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error compensating order',
      error: error.message,
    });
  }
});

/**
 * Get Order - Retrieve order details
 */
router.get('/get-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Order Service] Error fetching order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
});

module.exports = router;
