import express from "express";
import bodyParser from "body-parser";
import { handleCommand } from "./commands.js";
import { initRabbit } from "./eventstore.js";
import { handleEvent } from "./projections.js";
import amqp from "amqplib";

const app = express();
app.use(bodyParser.json());

// Initialize RabbitMQ
await initRabbit();

// Consume events to update Postgres projections
const conn = await amqp.connect("amqp://rabbitmq:5672");
const channel = await conn.createChannel();
await channel.assertQueue("events");
channel.consume("events", async (msg) => {
  if (msg) {
    const evt = JSON.parse(msg.content.toString());
    await handleEvent(evt);
    channel.ack(msg);
  }
});

// API endpoint
app.post("/command/:accountId", async (req, res) => {
  try {
    const result = await handleCommand(req.params.accountId, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
