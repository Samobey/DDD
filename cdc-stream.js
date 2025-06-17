require("dotenv").config();
const fs = require("fs");
const {
  LogicalReplicationService,
  TestDecodingPlugin,
} = require("pg-logical-replication");
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "cdc-streamer",
  brokers: [process.env.KAFKA_BROKER],
  ssl: {
    ca: [fs.readFileSync("ca.pem", "utf-8")],
  },
  sasl: {
    mechanism: "plain", // or 'scram-sha-256' if configured differently
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

const producer = kafka.producer();

async function start() {
  const slotName = "cdc_slot";

  // PostgreSQL logical replication connection config
  const service = new LogicalReplicationService(
    {
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      replication: "database",
      ssl: { rejectUnauthorized: false },
    },
    {
      acknowledge: {
        auto: true,
        timeoutSeconds: 10,
      },
    }
  );

  // Use the test_decoding plugin
  const plugin = new TestDecodingPlugin();

  // Kafka connect
  await producer.connect();
  console.log("✅ Kafka producer connected");

  // Listen to data changes
  service.on("data", async (lsn, log) => {
    try {
      // Filter out BEGIN and COMMIT transactions, or handle them differently if needed
      if (log.trx) {
        console.log(`[WAL] Transaction event: ${log.trx}`);
        return; // skip sending this to Kafka if you want
      }

      // Build a simplified payload
      if (log.schema && log.table && log.action && log.data) {
        const cleanData = {};

        log.data.forEach((field) => {
          cleanData[field.name] = field.value;
        });

        const payload = {
          schema: log.schema,
          table: log.table,
          action: log.action,
          data: cleanData,
        };

        const messageValue = JSON.stringify(payload);

        console.log("[WAL] Parsed event:", messageValue);

        await producer.send({
          topic: process.env.KAFKA_TOPIC,
          messages: [{ value: messageValue }],
        });
      }
    } catch (err) {
      console.error("Error processing replication event:", err);
    }
  });

  service.on("error", (err) => {
    console.error("❌ Replication error:", err);
  });

  try {
    await service.subscribe(plugin, slotName);
    console.log("✅ Subscribed to replication slot:", slotName);
  } catch (error) {
    console.error("❌ Subscription failed:", error);
  }
}

start();
