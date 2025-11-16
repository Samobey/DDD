import amqplib from "amqplib";

const RABBIT = "amqp://guest:guest@localhost:5672";

// Stores the *next expected* sequence for each aggregate
const pointers = {};   // { aggregateId: nextSeqNumber }

// Buffers out-of-order events until needed
const buffers = {};    // { aggregateId: Map(seq -> event) }

// Attempt to deliver buffered events in the correct order
function tryFlush(id) {
  const buffer = buffers[id] || new Map();
  let expected = pointers[id] || 1;

  // Process events in correct order while we have the next one available
  while (buffer.has(expected)) {
    const event = buffer.get(expected);
    console.log(`[MITIGATED] APPLY seq=${expected}`);
    buffer.delete(expected);
    expected++;
  }

  // Update stored pointer
  pointers[id] = expected;
}

async function run() {
  // Connect and create channel
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();

  // Ensure queue exists
  await ch.assertQueue("orders.q", { durable: true });

  // Allow some parallelism but we'll buffer + reorder
  await ch.prefetch(10);

  console.log("Mitigating consumer started (with in-memory reordering)");

  // Consume messages
  ch.consume("orders.q", msg => {
    if (!msg) return;
    const e = JSON.parse(msg.content.toString());

    // Ensure buffer exists for this aggregate
    buffers[e.aggregateId] = buffers[e.aggregateId] || new Map();

    // Store event by its sequence number
    buffers[e.aggregateId].set(e.seq, e);
    console.log(`[MITIGATE] STORED seq=${e.seq}`);

    // Try applying any in-order events now
    tryFlush(e.aggregateId);

    // Since it's buffered, we can safely ack now
    ch.ack(msg);

  }, { noAck: false });
}

run().catch(console.error);
