const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.post('/orders', async (req, res) => {
  const { item, quantity } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      'INSERT INTO orders (item, quantity) VALUES (?, ?)',
      [item, quantity]
    );

    const eventPayload = {
      orderId: orderResult.insertId,
      item,
      quantity,
    };

    await conn.execute(
      'INSERT INTO outbox (event_type, payload) VALUES (?, ?)',
      ['OrderCreated', JSON.stringify(eventPayload)]
    );

    await conn.commit();
    res.status(201).json({ message: 'Order created!' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

app.listen(3000, () => console.log('Order service running on port 3000'));
