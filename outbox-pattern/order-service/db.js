const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql',
  user: 'root',
  password: 'root',
  database: 'orders',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
