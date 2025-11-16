// consumer_idempotent.js
import amqplib from "amqplib";
const processed = new Set(); // in memory for demo, use Redis/Postgres in real life

let balance = 1000;

const conn = await amqplib.connect("amqp://localhost");
const ch = await conn.createChannel();
await ch.assertQueue("payments");

await ch.consume("payments", msg => {
  const event = JSON.parse(msg.content.toString());
  const messageId = event.userId + ":" + event.amount; // real systems use event.id

  if (processed.has(messageId)) {
    console.log("Duplicate detected. Skipping.");
    return ch.ack(msg);
  }

  balance -= event.amount;
  processed.add(messageId);

  console.log("Processed payment. Balance:", balance);
  ch.ack(msg);
});
