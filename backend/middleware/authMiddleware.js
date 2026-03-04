const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'mySuperSecretKey123'; // ควรย้ายไปไว้ใน .env

// 1. เช็คว่า Login หรือยัง (Verify Token)
exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    // ถ้า Token หมดอายุหรือไม่ถูกต้อง ให้เคลียร์ Cookie ทิ้งเลย
    res.clearCookie('token');
    res.clearCookie('role');
    res.status(400).json({ error: 'Invalid Token' });
  }
};

// 2. เช็คว่าเป็น Admin ไหม
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Require Admin Role!' });
  }
  next();
};