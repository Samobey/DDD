import { createPoolFromEnv } from './db.js';

async function userA() {
  const pool = await createPoolFromEnv();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    console.log('User A: locking account 1 (UPDATE 1)');
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 1');

    // simulate some complex queries for 15 seconds 
    await new Promise(r => setTimeout(r, 15000));

    console.log('User A: attempting to update account 2 (will block if locked by User B)');
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 2');

    await conn.commit();
    console.log('User A: committed');
  } catch (err) {
    console.error('User A: error', err && (err.code || err.errno), err.message);
    try { await conn.rollback(); } catch (_) {}
  } finally {
    conn.release();
    await pool.end();
  }
}

userA().catch(e => console.error('User A fatal:', e));