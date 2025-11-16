import amqplib from "amqplib";

const RABBIT = "amqp://guest:guest@localhost:5672";
const EX = "events";     // Exchange name
const RK = "orders";     // Routing key

async function run() {
  // Connect to RabbitMQ
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();

  // Create a direct exchange and queue, then bind them
  await ch.assertExchange(EX, "direct", { durable: true });
  await ch.assertQueue("orders.q", { durable: true });
  await ch.bindQueue("orders.q", EX, RK);

  const id = "order-1";  // We're simulating events for one logical aggregate

  // Publish 15 events with increasing sequence numbers
  for (let i = 1; i <= 15; i++) {
    const ev = { aggregateId: id, seq: i, ts: Date.now() };
    ch.publish(EX, RK, Buffer.from(JSON.stringify(ev)), { persistent: true });
    // Small delay to avoid blasting all at once
    await new Promise(r => setTimeout(r, 20));
  }

  // Clean up
  await ch.close();
  await conn.close();
  console.log("Published events seq=1..15");
}

run().catch(console.error);
