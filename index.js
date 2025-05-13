import express from "express";
import pg from "pg";
import format from "pg-format";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // use only in dev; for production, configure certs properly
  },
});

await client.connect().then(() => {
  console.log("Connection to DB established.");
});

/* NOTIFY/LISTEN */
await client.query("LISTEN new_order_channel");

client.on("notification", (msg) => {
  const order = JSON.parse(msg.payload);
  console.log("📦 New Order Received:", order);
  console.log("📧 Sending out the e-mail");
});

app.post("/create-order", async (req, res) => {
  const { user_id, product, amount } = req.body;

  await client.query(
    `INSERT INTO orders (user_id, product, amount) VALUES ($1, $2, $3)`,
    [user_id, product, amount]
  );

  res.status(201);
});

/* Row-Level Security */
app.post("/login", async (req, res) => {
  const userId = req.body.user_id;
  const query = format("SET app.current_user_id = %L", userId);
  await client.query(query);

  console.log("🔒 RLS enabled per user, with current ID:", userId);

  res.status(200).json(userId);

  /* 
      Now every query like:
      await db.query('SELECT * FROM orders');

      Will automatically become:
      SELECT * FROM orders WHERE user_id = <current_user_id>;
    */
});

/* Advisory Locks */
app.post("/prepare-email", async (req, res) => {
  const orderId = req.body.order_id;

  // Try to lock this specific order
  const lockKey = orderId;
  const { rows } = await client.query(
    "SELECT pg_try_advisory_lock($1) AS locked",
    [lockKey]
  );

  if (!rows[0].locked) {
    console.log("🚫 Order is being processed elsewhere. Skipping.");
    process.exit(0);
  }

  try {
    console.log("🔒 Locked order. Processing...");
    const res = await client.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    const order = res.rows[0];

    if (order.status !== "paid") {
      setTimeout(async () => {
        await client.query("UPDATE orders SET status = $1 WHERE id = $2", [
          "paid",
          orderId,
        ]);
        console.log("✅ Order marked as paid!");

        res.status(200).json(orderId);
      }, 3000);
    } else {
      console.log("ℹ️ Order already paid.");
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [lockKey]);
  }
});

/* Custom Data Types & Composite Types */
app.get("/addresses/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await client.query(
      "SELECT home_address FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Result will be like: { home_address: '(123 Main St,Berlin,10115)' }
    const compositeStr = result.rows[0].home_address;
    const [street, city, zip] = compositeStr.slice(1, -1).split(",");

    console.log("📍 Home address is:", street, city, zip);

    res.status(200).json({ street, city, zip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

/* JSONB */
app.get("/user-settings/theme/:theme", async (req, res) => {
  const theme = req.params.theme;

  try {
    const query = `
        SELECT id, name, settings
        FROM users
        WHERE settings ->> 'theme' = $1;
      `;
    const { rows } = await client.query(query, [theme]);

    console.log("✨ Users with such theme are:", rows);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching user settings:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
