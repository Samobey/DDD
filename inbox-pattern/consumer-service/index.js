const amqp = require('amqplib');
const db = require('./db');

(async () => {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue('orders');

  channel.consume('orders', async (msg) => {
    if (msg !== null) {
      const payload = JSON.parse(msg.content.toString());
      const inboxId = `order-${payload.orderId}`;

      try {
        // Ensure message is processed only once
        await db.execute(
          'INSERT INTO inbox (id, event_type, payload) VALUES (?, ?, ?)',
          [inboxId, 'OrderCreated', JSON.stringify(payload)]
        );

        // Simulate processing
        console.log(`✅ Processed order: ${payload.orderId}`);

        channel.ack(msg);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Message ${inboxId} already processed. Skipping.`);
          channel.ack(msg); // Still acknowledge to remove from queue
        } else {
          console.error(`❌ Failed to process message: ${err.message}`);
          channel.nack(msg); // RabbitMQ will redeliver
        }
      }
    }
  });
})();
