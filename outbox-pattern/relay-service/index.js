const amqp = require('amqplib');
const waitForDb = require('./db');

async function waitForRabbit(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect('amqp://rabbitmq');
      const channel = await conn.createChannel();
      console.log('✅ Connected to RabbitMQ');
      return { conn, channel };
    } catch (err) {
      console.log(`⏳ Waiting for RabbitMQ (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('❌ Could not connect to RabbitMQ');
}

(async () => {
  const db = await waitForDb();
  const { conn, channel } = await waitForRabbit();

  await channel.assertQueue('orders');

  setInterval(async () => {
    const [rows] = await db.execute(
      'SELECT * FROM outbox WHERE published = 0 ORDER BY id ASC LIMIT 10'
    );

    for (const row of rows) {
      const message = {
        orderId: row.payload.orderId,
        amount: row.payload.quantity,
      };

      channel.sendToQueue('orders', Buffer.from(JSON.stringify(message)));
      await db.execute('UPDATE outbox SET published = 1 WHERE id = ?', [row.id]);

      console.log(`📤 Sent message for order ${row.payload.orderId}`);
    }
  }, 10000);
})();
