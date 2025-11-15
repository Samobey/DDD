import { createPoolFromEnv } from '../db.js';

async function userB() {
  const pool = await createPoolFromEnv();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Explicit row locking: SELECT ... FOR UPDATE acquires locks on both rows at the same time
    console.log('User B: acquiring locks on accounts 1 and 2 with SELECT ... FOR UPDATE');
    await conn.query('SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE');

    // Now perform the updates
    console.log('User B: updating account 2');
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 2');

    console.log('User B: updating account 1');
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 1');

    await conn.commit();
    console.log('User B: committed successfully');
  } catch (err) {
    console.error('User B: error', err && (err.code || err.errno), err.message);
    try { await conn.rollback(); } catch (_) {}
  } finally {
    conn.release();
    await pool.end();
  }
}

userB().catch(e => console.error('User B fatal:', e));
