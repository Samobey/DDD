import { EventStoreDBClient, jsonEvent, FORWARDS, START } from "@eventstore/db-client";
import amqp from "amqplib";

export const eventStore = new EventStoreDBClient(
  { endpoint: "eventstore:2113" },
  { insecure: true }
);

let rabbitChannel;
export async function initRabbit() {
  const conn = await amqp.connect("amqp://rabbitmq:5672");
  rabbitChannel = await conn.createChannel();
  await rabbitChannel.assertQueue("events");
}

// Append event to EventStore + publish to RabbitMQ
export async function appendEvent(stream, eventType, data) {
  const event = jsonEvent({ type: eventType, data });
  await eventStore.appendToStream(stream, [event]);
  if (rabbitChannel) {
    await rabbitChannel.sendToQueue("events", Buffer.from(JSON.stringify({ type: eventType, data, stream })));
  }
}

// Read all events from a stream
export async function readStream(stream) {
  const events = [];
  for await (const resolvedEvent of eventStore.readStream(stream, { direction: FORWARDS, fromRevision: START })) {
    events.push({ type: resolvedEvent.event.type, data: resolvedEvent.event.data });
  }
  return events;
}
