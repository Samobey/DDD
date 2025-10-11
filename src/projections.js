import { pgPool } from "./db.js";

export async function handleEvent(event) {
  const { type, data } = event;

  if (type === "DEPOSIT") {
    await pgPool.query(
      `INSERT INTO account_balances(account_id, balance) 
       VALUES ($1, $2)
       ON CONFLICT(account_id) DO UPDATE SET balance = account_balances.balance + $2`,
      [data.accountId, data.amount]
    );
  }

  if (type === "WITHDRAW") {
    await pgPool.query(
      `UPDATE account_balances 
       SET balance = balance - $2 WHERE account_id = $1`,
      [data.accountId, data.amount]
    );
  }
}
