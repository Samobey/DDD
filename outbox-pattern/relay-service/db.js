const mysql = require('mysql2/promise');

async function waitForDb(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await mysql.createConnection({
        host: 'mysql',
        user: 'root',
        password: 'root',
        database: 'orders',
      });
      console.log('✅ Connected to MySQL');
      return connection;
    } catch (err) {
      console.log(`⏳ Waiting for MySQL (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('❌ Could not connect to MySQL');
}

module.exports = waitForDb;
