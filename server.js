const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const recommendationRoutes = require('./routes/recommendations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BookStore API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      books: {
        getAll: 'GET /api/books',
        getOne: 'GET /api/books/:id',
        create: 'POST /api/books (Admin)',
        update: 'PUT /api/books/:id (Admin)',
        delete: 'DELETE /api/books/:id (Admin)'
      },
      cart: {
        get: 'GET /api/cart (Protected)',
        add: 'POST /api/cart (Protected)',
        update: 'PUT /api/cart/:bookId (Protected)',
        remove: 'DELETE /api/cart/:bookId (Protected)'
      },
      orders: {
        create: 'POST /api/orders (Protected)',
        getUserOrders: 'GET /api/orders (Protected)',
        getAll: 'GET /api/orders/admin/all (Admin)'
      },
      recommendations: {
        forYou: 'GET /api/recommendations/for-you (Protected)',
        popular: 'GET /api/recommendations/popular'
      }
    },
    frontend: 'http://localhost:3000',
    documentation: 'See README.md for full API documentation'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
