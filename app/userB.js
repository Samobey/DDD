import { createPoolFromEnv } from './db.js';

async function userB() {
  const pool = await createPoolFromEnv();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    console.log('User B: locking account 2 (UPDATE 2)');
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 2');

    console.log('User B: attempting to update account 1 (will block if locked by User A)');
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 1');

    await conn.commit();
    console.log('User B: committed');
  } catch (err) {
    console.error('User B: error', err && (err.code || err.errno), err.message);
    try { await conn.rollback(); } catch (_) {}
  } finally {
    conn.release();
    await pool.end();
  }
}

userB().catch(e => console.error('User B fatal:', e));