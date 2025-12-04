const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Shipment = require('../../models/Shipment');
const SagaLog = require('../../models/SagaLog');
const Outbox = require('../../models/Outbox');
const { withTransaction } = require('../../utils/transaction');

const router = express.Router();

/**
 * Deliver Order - Step 4 of the Saga (Final Step)
 * Ship the product and mark saga as complete
 * Requires idempotency-key for idempotent retries
 */
router.post('/deliver-order', async (req, res) => {
  try {
    const { orderId, customerId, sagaId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!orderId || !customerId || !sagaId) {
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

    // Check if shipment already created
    const existingShipment = await Shipment.findOne({ idempotencyKey });
    if (existingShipment) {
      console.log(`[Shipping Service] Shipment already created with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Shipment already created',
        data: existingShipment,
        sagaId,
      });
    }

    // Get saga log to track progress
    let sagaLog = await SagaLog.findOne({ sagaId });
    
    if (!sagaLog) {
      return res.status(404).json({
        success: false,
        message: 'Saga not found',
      });
    }

    // Execute shipment creation and saga completion without transaction
    try {
      const shipment = new Shipment({
        shipmentId: uuidv4(),
        idempotencyKey,
        orderId,
        customerId,
        status: 'SHIPPED',
        sagaId,
      });

      await shipment.save();
      console.log(`[Shipping Service] Shipment created: ${orderId}`);

      // Update saga log
      const shippingStep = sagaLog.steps.find(s => s.stepName === 'DELIVER_ORDER');
      if (shippingStep) {
        shippingStep.status = 'IN_PROGRESS';
        shippingStep.timestamp = new Date();
        await sagaLog.save();

        console.log(`[Shipping Service] Order delivered: ${orderId}`);

        // Mark saga as completed
        shippingStep.status = 'COMPLETED';
        sagaLog.status = 'COMPLETED';
        await sagaLog.save();

        console.log(`[Shipping Service] Saga COMPLETED: ${sagaId}\n`);
      } else {
        console.error(`[Shipping Service] DELIVER_ORDER step not found in saga`);
      }

      return shipment;
    } catch (innerError) {
      throw innerError;
    }

    res.status(201).json({
      success: true,
      message: 'Order shipped successfully and saga completed',
      sagaId,
    });

  } catch (error) {
    console.error('[Shipping Service] Error delivering order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error delivering order',
      error: error.message,
    });
  }
});

/**
 * Cancel Shipment - Compensate shipment
 * Also requires idempotency-key for idempotent compensation
 */
router.post('/cancel-shipment', async (req, res) => {
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

    // Check if already cancelled
    if (await Shipment.findOne({ compensationKey: idempotencyKey, orderId })) {
      console.log(`[Shipping Service] Shipment already cancelled with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Shipment already cancelled',
      });
    }

    const shipment = await Shipment.findOneAndUpdate(
      { orderId, sagaId },
      { 
        status: 'CANCELLED',
        compensationKey: idempotencyKey,
      },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    console.log(`[Shipping Service] Shipment cancelled: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: shipment,
    });
  } catch (error) {
    console.error('[Shipping Service] Error cancelling shipment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error cancelling shipment',
      error: error.message,
    });
  }
});

/**
 * Get Shipment - Retrieve shipment details
 */
router.get('/get-shipment/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('[Shipping Service] Error fetching shipment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching shipment',
      error: error.message,
    });
  }
});

module.exports = router;
