import amqplib from "amqplib";

const RABBIT = "amqp://guest:guest@localhost:5672";
// Default processing delay, can override via environment variable
const DELAY = Number(process.env.PROCESS_DELAY || 50);

async function run() {
  // Connect and create channel
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();

  // Ensure queue exists
  await ch.assertQueue("orders.q", { durable: true });

  // Allow processing multiple messages at the same time (this is what can cause out-of-order completion)
  await ch.prefetch(5);

  console.log(`Consumer started with base delay=${DELAY}ms`);

  // Consume messages
  ch.consume("orders.q", async msg => {
    if (!msg) return;

    const e = JSON.parse(msg.content.toString());
    console.log(`[${DELAY}] RECEIVED seq=${e.seq}`);

    // Artificial unpredictable processing delay:
    // Every 5th message takes much longer -> this simulates a slow consumer.
    const extra = e.seq % 5 === 0 ? 400 : 0;

    // Simulate processing
    await new Promise(r => setTimeout(r, DELAY + extra));

    console.log(`[${DELAY}] PROCESSED seq=${e.seq}`);

    // Acknowledge message completion
    ch.ack(msg);

  }, { noAck: false });
}

run().catch(console.error);
