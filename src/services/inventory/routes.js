const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Inventory = require('../../models/Inventory');
const SagaLog = require('../../models/SagaLog');
const Outbox = require('../../models/Outbox');
const { withTransaction } = require('../../utils/transaction');

const router = express.Router();

// Service URLs from environment
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';

/**
 * Update Inventory - Step 3 of the Saga
 * Reduce stock and call Shipping Service next
 * Requires idempotency-key for idempotent retries
 */
router.post('/update-inventory', async (req, res) => {
  try {
    const { orderId, productId, quantity, sagaId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!orderId || !productId || !quantity || !sagaId) {
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

    // Check if inventory already updated
    const existingInventoryLog = await Inventory.findOne({ 
      lastIdempotencyKey: idempotencyKey
    });
    if (existingInventoryLog) {
      console.log(`[Inventory Service] Inventory already updated with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Inventory already updated',
        data: existingInventoryLog,
      });
    }

    // Get saga log to track progress
    let sagaLog = await SagaLog.findOne({ sagaId });

    // Execute inventory update without transaction
    try {
      let inventory = await Inventory.findOne({ productId });

      if (!inventory) {
        // Initialize inventory with default stock of 100 units
        inventory = new Inventory({
          productId,
          quantity: 100,
          reservedQuantity: 0,
        });
        await inventory.save();
        console.log(`[Inventory Service] Initialized inventory for product ${productId} with 100 units`);
      }

      // Update saga log
      const inventoryStep = sagaLog.steps.find(s => s.stepName === 'UPDATE_INVENTORY');
      inventoryStep.status = 'IN_PROGRESS';
      inventoryStep.timestamp = new Date();
      await sagaLog.save();

      // Check if there's enough inventory
      if (inventory.quantity - inventory.reservedQuantity < quantity) {
        console.log(`[Inventory Service] Insufficient inventory for product: ${productId}`);
        
        // Update saga log
        inventoryStep.status = 'FAILED';
        inventoryStep.error = 'Insufficient inventory';
        await sagaLog.save();

        throw new Error('Insufficient inventory');
      }

      // Update inventory - reduce available quantity and increase reserved
      inventory.quantity -= quantity;
      inventory.reservedQuantity += quantity;
      inventory.lastIdempotencyKey = idempotencyKey;
      await inventory.save();

      console.log(`[Inventory Service] Inventory updated for product: ${productId}`);

      // Update saga log
      inventoryStep.status = 'COMPLETED';
      await sagaLog.save();

      // Write shipping event to Outbox
      console.log(`[Inventory Service] Writing shipping event to Outbox`);

      const shippingEventId = uuidv4();
      const outboxEntry = new Outbox({
        eventId: shippingEventId,
        aggregateId: orderId,
        eventType: 'InventoryUpdated',
        payload: {
          orderId,
          customerId: sagaLog.customerId || 'unknown',
          sagaId,
        },
        targetService: 'shipping',
        targetEndpoint: '/shipments/deliver-order',
        published: false,
      });

      await outboxEntry.save();
      console.log(`[Inventory Service] Shipping event written to Outbox: ${shippingEventId}`);
      console.log(`[Inventory Service] Saga will be completed when Shipping processes event\n`);

      return { inventory, outboxEntry };
    } catch (innerError) {
      throw innerError;
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated - shipping event queued',
    });

  } catch (error) {
    console.error('[Inventory Service] Error updating inventory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory',
      error: error.message,
    });
  }
});

/**
 * Compensate Inventory - Reverse inventory update
 * Also requires idempotency-key for idempotent compensation
 */
router.post('/compensate-inventory', async (req, res) => {
  try {
    const { orderId, productId, quantity, sagaId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!orderId || !productId || !quantity || !sagaId) {
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

    // Check if already compensated
    if (await Inventory.findOne({ compensationKey: idempotencyKey, orderId })) {
      console.log(`[Inventory Service] Inventory already compensated with key: ${idempotencyKey}`);
      return res.status(200).json({
        success: true,
        message: 'Inventory already compensated',
      });
    }

    let inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found',
      });
    }

    // Restore inventory
    inventory.quantity += quantity;
    inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);
    inventory.compensationKey = idempotencyKey;
    await inventory.save();

    console.log(`[Inventory Service] Inventory compensated for product: ${productId}`);

    res.status(200).json({
      success: true,
      message: 'Inventory compensated successfully',
      data: inventory,
    });
  } catch (error) {
    console.error('[Inventory Service] Error compensating inventory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error compensating inventory',
      error: error.message,
    });
  }
});

/**
 * Initialize Inventory - Add products to inventory (for demo purposes)
 */
router.post('/initialize', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    let inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      inventory = new Inventory({
        productId,
        quantity,
        reservedQuantity: 0,
      });
    } else {
      inventory.quantity += quantity;
    }

    await inventory.save();

    res.status(200).json({
      success: true,
      message: 'Inventory initialized',
      data: inventory,
    });
  } catch (error) {
    console.error('[Inventory Service] Error initializing inventory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error initializing inventory',
      error: error.message,
    });
  }
});

/**
 * Get Inventory - Retrieve inventory details
 */
router.get('/get-inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('[Inventory Service] Error fetching inventory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message,
    });
  }
});

async function _compensate(orderId, sagaId, sagaLog) {
  console.log(`[Inventory Service] Starting compensation chain`);
  // Compensation will be handled by calling services
}

module.exports = router;
