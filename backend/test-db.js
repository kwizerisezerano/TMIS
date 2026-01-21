const mysql = require('mysql2/promise');
require('dotenv').config();

const testConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Database connected successfully');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('Users table exists, count:', rows[0].count);
    
    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

testConnection();