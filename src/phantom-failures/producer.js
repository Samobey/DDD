// producer.js
import amqplib from "amqplib";

const conn = await amqplib.connect("amqp://localhost");
const ch = await conn.createChannel();
await ch.assertQueue("payments");

const msg = { userId: "u1", amount: 50 };
ch.sendToQueue("payments", Buffer.from(JSON.stringify(msg)), { persistent: true });

console.log("Sent payment");
