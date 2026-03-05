const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const scorerRoutes = require('./routes/scorerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Setup Middleware FIRST
// ==========================================
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ],
  credentials: true,
}));
app.use(cookieParser());

// These parsers must run BEFORE the routes so req.body exists
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. Setup Routes SECOND
// ==========================================
app.use('/api/scorer', scorerRoutes);
app.use('/api', apiRoutes);


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API Endpoint: http://localhost:${PORT}/api`);
});