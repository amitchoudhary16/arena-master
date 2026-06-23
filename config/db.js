const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'esports_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully as ID ' + connection.threadId);
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Please make sure MySQL is running and credentials in .env are correct.');
  }
})();

module.exports = pool;
