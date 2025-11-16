// consumer_bad.js
import amqplib from "amqplib";

let balance = 1000;

const conn = await amqplib.connect("amqp://localhost");
const ch = await conn.createChannel();
await ch.assertQueue("payments");
await ch.consume("payments", async msg => {
  const event = JSON.parse(msg.content.toString());

  // Process (SIDE EFFECT)
  balance -= event.amount;
  console.log("Charged user. Balance:", balance);

  // Simulate crash *before* ack  (phantom failure)
  process.exit(1);

  ch.ack(msg);
});
