// consumer_optimistic.js
import amqplib from "amqplib";

// DB stores version along with state: { balance, version }
// Start with version=1
const DB = { "acct-123": { balance: 1000, version: 1 } };

const RABBIT = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE = "events";
const ROUTING_KEY = "acct.update";

async function persistenceCompareAndSwap(id, expectedVersion, computeNewState) {
  // Simulated atomic CAS on in-memory DB.
  const row = DB[id];
  if (row.version !== expectedVersion) {
    // indicate conflict
    return { success: false, current: { ...row } };
  }
  // apply update
  const newState = computeNewState({ ...row });
  // increment version to show change
  row.balance = newState.balance;
  row.version += 1;
  return { success: true, new: { ...row } };
}

async function main() {
  const conn = await amqplib.connect(RABBIT);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, "direct", { durable: true });
  const { queue } = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(queue, EXCHANGE, ROUTING_KEY);
  await ch.prefetch(2);

  console.log("Optimistic consumer started. DB start:", DB);

  ch.consume(queue, async msg => {
    const ev = JSON.parse(msg.content.toString());
    const id = ev.aggregateId;

    // 1) READ current state + version
    const current = DB[id];
    const readVersion = current.version;
    console.log(`[OK] READ balance=${current.balance} ver=${readVersion} (event ${ev.id})`);

    // simulate processing delay to encourage conflict
    await new Promise(r => setTimeout(r, ev.id === "e1" ? 500 : 100));

    // 2) Attempt CAS
    const result = await persistenceCompareAndSwap(id, readVersion, row => {
      row.balance += ev.delta; // compute new state
      return row;
    });

    if (result.success) {
      console.log(`[OK] COMMITTED new balance=${result.new.balance} ver=${DB[id].version} (event ${ev.id})`);
      ch.ack(msg);
    } else {
      // Conflict detected: we can retry (read latest and reapply) or publish a compensation
      console.log(`[OK] CONFLICT detected. current balance=${result.current.balance} ver=${result.current.version} (event ${ev.id})`);
      // Simple strategy: retry once by re-enqueuing with short delay (demo)
      setTimeout(() => {
        // re-publish original event to try again (in real life implement backoff/exponential retries)
        ch.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(ev)), { persistent: true });
        ch.ack(msg);
      }, 200);
    }
  }, { noAck: false });
}

main().catch(console.error);
