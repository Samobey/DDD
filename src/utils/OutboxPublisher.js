const axios = require('axios');
const Outbox = require('../models/Outbox');

class OutboxPublisher {
  constructor(pollIntervalMs = 1000, batchSize = 10) {
    this.pollIntervalMs = pollIntervalMs;
    this.batchSize = batchSize;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[OutboxPublisher] Started with interval:', this.pollIntervalMs, 'ms');
    this.poll();
  }

  stop() {
    this.isRunning = false;
    console.log('[OutboxPublisher] Stopped');
  }

  async poll() {
    while (this.isRunning) {
      try {
        await this.publishPendingEvents();
      } catch (error) {
        console.error('[OutboxPublisher] Error in polling loop:', error.message);
      }
      await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  async publishPendingEvents() {
    try {
      // Find unpublished events, oldest first
      const events = await Outbox.find({
        published: false,
        publishAttempts: { $lt: 3 },
      })
        .sort({ createdAt: 1 })
        .limit(this.batchSize);

      if (events.length === 0) return;

      console.log(`[OutboxPublisher] Found ${events.length} unpublished events`);

      for (const event of events) {
        await this.publishEvent(event);
      }
    } catch (error) {
      console.error('[OutboxPublisher] Error fetching pending events:', error.message);
    }
  }

  async publishEvent(event) {
    try {
      const targetUrl = this.buildTargetUrl(event.targetService, event.targetEndpoint);
      
      console.log(`[OutboxPublisher] Publishing event: ${event.eventType} to ${targetUrl}`);

      // Get idempotency key from event or generate
      const idempotencyKey = event.aggregateId + '-' + event.eventType;

      const response = await axios.post(
        targetUrl,
        event.payload,
        {
          headers: {
            'idempotency-key': idempotencyKey,
          },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        // Mark as published
        event.published = true;
        event.publishedAt = new Date();
        await event.save();

        console.log(`[OutboxPublisher] Event published successfully: ${event.eventId}`);
      } else {
        throw new Error(`Service returned failure: ${response.data.message}`);
      }
    } catch (error) {
      console.error(`[OutboxPublisher] Failed to publish event ${event.eventId}: ${error.message}`);

      // Increment attempts and record error
      event.publishAttempts += 1;
      event.lastError = error.message;

      if (event.publishAttempts >= event.maxRetries) {
        console.error(`[OutboxPublisher] Event ${event.eventId} exhausted all retries`);
        event.published = false; // Mark as failed permanently
      }

      await event.save();
    }
  }

  buildTargetUrl(service, endpoint) {
    const baseUrls = {
      order: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
      inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
      shipping: process.env.SHIPPING_SERVICE_URL || 'http://localhost:3004',
    };

    const baseUrl = baseUrls[service];
    if (!baseUrl) throw new Error(`Unknown service: ${service}`);

    // endpoint is like "/update-inventory", we just need to add /api prefix
    return `${baseUrl}/api${endpoint}`;
  }
}

module.exports = OutboxPublisher;
