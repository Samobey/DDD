// consumer_bad.js
import amqplib from "amqplib";

// In-memory DB simulation: { [aggregateId]: { balance } }
// This demo uses in-memory for simplicity — restart loses state.
const DB = { "acct-123": { balance: 1000 } };

const RABBIT = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE = "events";
const ROUTING_KEY = "acct.update";

async function main() {
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, "direct", { durable: true });
  const { queue } = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(queue, EXCHANGE, ROUTING_KEY);
  await ch.prefetch(2);

  console.log("Naive consumer started. DB start:", DB);

  ch.consume(queue, async msg => {
    const ev = JSON.parse(msg.content.toString());
    const id = ev.aggregateId;

    // 1) READ (stale read possible)
    const row = DB[id];
    console.log(`[BAD] READ balance=${row.balance} for ${id} (event ${ev.id})`);

    // simulate processing delay to encourage overlap
    await new Promise(r => setTimeout(r, ev.id === "e1" ? 500 : 100));

    // 2) APPLY
    row.balance += ev.delta;
    console.log(`[BAD] WROTE balance=${row.balance} after applying delta=${ev.delta} (event ${ev.id})`);

    // 3) ACK
    ch.ack(msg);
  }, { noAck: false });
}

main().catch(console.error);
