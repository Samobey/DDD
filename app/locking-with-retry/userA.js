import { createPoolFromEnv } from '../db.js';

const DEADLOCK_ERROR_CODE = 1213;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100; // milliseconds

async function executeUserATransaction(pool, retryCount = 0) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    console.log(`User A: locking account 1 (UPDATE 1) [Attempt ${retryCount + 1}]`);
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 1');

    // simulate some complex queries for 15 seconds 
    await new Promise(r => setTimeout(r, 15000));

    console.log('User A: attempting to update account 2 (will block if locked by User B)');
    await conn.query('UPDATE accounts SET balance = balance + 10 WHERE id = 2');

    await conn.commit();
    console.log('User A: committed');
  } catch (err) {
    // Rollback on error
    try { await conn.rollback(); } catch (_) {}

    // Check if it's a deadlock error
    if (err.errno === DEADLOCK_ERROR_CODE && retryCount < MAX_RETRIES) {
      console.warn(`User A: Deadlock detected (${err.code}). Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return executeUserATransaction(pool, retryCount + 1);
    }

    // If not a deadlock or max retries exceeded, log the error
    console.error('User A: error', err && (err.code || err.errno), err.message);
    throw err;
  } finally {
    conn.release();
  }
}

async function userA() {
  const pool = await createPoolFromEnv();
  try {
    await executeUserATransaction(pool);
  } catch (err) {
    console.error('User A fatal:', err.message);
  } finally {
    await pool.end();
  }
}

userA().catch(e => console.error('User A fatal:', e));
