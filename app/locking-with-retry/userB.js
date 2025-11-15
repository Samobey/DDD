import { createPoolFromEnv } from '../db.js';

const DEADLOCK_ERROR_CODE = 1213;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100; // milliseconds

async function executeUserBTransaction(pool, retryCount = 0) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    console.log(`User B: locking account 2 (UPDATE 2) [Attempt ${retryCount + 1}]`);
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 2');

    console.log('User B: attempting to update account 1 (will block if locked by User A)');
    await conn.query('UPDATE accounts SET balance = balance - 10 WHERE id = 1');

    await conn.commit();
    console.log('User B: committed');
  } catch (err) {
    // Rollback on error
    try { await conn.rollback(); } catch (_) {}

    // Check if it's a deadlock error
    if (err.errno === DEADLOCK_ERROR_CODE && retryCount < MAX_RETRIES) {
      console.warn(`User B: Deadlock detected (${err.code}). Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return executeUserBTransaction(pool, retryCount + 1);
    }

    // If not a deadlock or max retries exceeded, log the error
    console.error('User B: error', err && (err.code || err.errno), err.message);
    throw err;
  } finally {
    conn.release();
  }
}

async function userB() {
  const pool = await createPoolFromEnv();
  try {
    await executeUserBTransaction(pool);
  } catch (err) {
    console.error('User B fatal:', err.message);
  } finally {
    await pool.end();
  }
}

userB().catch(e => console.error('User B fatal:', e));
