import { createPoolFromEnv } from '../db.js';

async function userA() {
  const pool = await createPoolFromEnv();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Explicit row locking: SELECT ... FOR UPDATE acquires locks on both rows at the same time
    console.log('User A: acquiring locks on accounts 1 and 2 with SELECT ... FOR UPDATE');
    await conn.query('SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE');

    // simulate some complex queries for 15 seconds 
    await new Promise(r => setTimeout(r, 15000));

    // Now perform the updates
    console.log('User A: updating account 1');
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 1');

    console.log('User A: updating account 2');
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 2');

    await conn.commit();
    console.log('User A: committed successfully');
  } catch (err) {
    console.error('User A: error', err && (err.code || err.errno), err.message);
    try { await conn.rollback(); } catch (_) {}
  } finally {
    conn.release();
    await pool.end();
  }
}

userA().catch(e => console.error('User A fatal:', e));
