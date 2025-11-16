// producer.js
import amqplib from "amqplib";

const RABBIT = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE = "events";
const ROUTING_KEY = "acct.update";

async function main() {
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, "direct", { durable: true });

  // Two updates that will be processed concurrently
  const aggregateId = "acct-123";
  const ev1 = { aggregateId, type: "AdjustBalance", delta: +100, id: "e1" };
  const ev2 = { aggregateId, type: "AdjustBalance", delta: -30,  id: "e2" };

  // publish both quickly (order may be same, but consumers run concurrently)
  ch.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(ev1)), { persistent: true });
  ch.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(ev2)), { persistent: true });

  console.log("Published two events for same aggregate (acct-123).");
  setTimeout(() => conn.close(), 300);
}

main().catch(console.error);
