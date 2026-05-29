const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const path      = require('path');
const connectDB = require('./config/db');

// Polyfill crypto global for Node.js 20+ compatibility
if (!global.crypto) {
  global.crypto = require('crypto');
}

dotenv.config();
connectDB();

const app = express();

const localOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...localOrigins, ...envOrigins])];

// ✅ CORS — allow local development plus deployed frontend origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api',       require('./routes/comments'));
app.use('/api/users', require('./routes/users'));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 BlogSpace API is running!',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});