const { Pool } = require('pg');
const path = require('path');

// โหลดค่าจากไฟล์ .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// เช็คค่า (Debug) - ดูว่าอ่านเจอไหม
console.log("Check Env:", {
    Host: process.env.DB_HOST,
    User: process.env.DB_USER,
    // เช็คว่า Password มาไหม (ไม่ต้องโชว์รหัสจริงเพื่อความปลอดภัย)
    HasPassword: !!process.env.DB_PASSWORD 
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  
  // 👇 จุดสำคัญ! ต้องแก้เป็น DB_PASSWORD ให้ตรงกับในไฟล์ .env
  password: process.env.DB_PASSWORD, 
  
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('❌ Database Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};