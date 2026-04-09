const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'assignment-2-test-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
process.env.NODE_ENV = 'test';

const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

const authRoutes = require('../routes/auth');
const bookRoutes = require('../routes/books');
const cartRoutes = require('../routes/cart');
const orderRoutes = require('../routes/orders');

const originalMethods = {
  User: {
    findOne: User.findOne,
    create: User.create,
    findById: User.findById,
    findByIdAndUpdate: User.findByIdAndUpdate
  },
  Book: {
    find: Book.find,
    countDocuments: Book.countDocuments,
    findById: Book.findById,
    findByIdAndUpdate: Book.findByIdAndUpdate
  },
  Order: {
    create: Order.create,
    find: Order.find,
    findById: Order.findById,
    countDocuments: Order.countDocuments,
    aggregate: Order.aggregate
  }
};

function restoreModelMethods() {
  Object.assign(User, originalMethods.User);
  Object.assign(Book, originalMethods.Book);
  Object.assign(Order, originalMethods.Order);
}

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  return app;
}

async function startServer(app) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    })
  };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

function makeProtectedUser(overrides = {}) {
  return {
    _id: overrides._id || 'user-1',
    name: overrides.name || 'Test User',
    email: overrides.email || 'test@example.com',
    isAdmin: overrides.isAdmin || false,
    cart: overrides.cart || [],
    likedBooks: overrides.likedBooks || [],
    purchaseHistory: overrides.purchaseHistory || [],
    save: overrides.save || (async function save() { return this; }),
    populate: overrides.populate || (async function populate() { return this; }),
    select: async function select() { return this; }
  };
}

function authHeader(userId = 'user-1') {
  return {
    Authorization: `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET)}`
  };
}

test.beforeEach(() => {
  restoreModelMethods();
});

test.after(() => {
  restoreModelMethods();
});

test('register creates a new user and returns a token', async () => {
  User.findOne = async () => null;
  User.create = async (payload) => ({
    _id: 'user-1',
    name: payload.name,
    email: payload.email,
    isAdmin: false
  });

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ayase',
        email: 'ayase@example.com',
        password: 'secret12'
      })
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.user.email, 'ayase@example.com');
    assert.ok(response.body.token);
  } finally {
    await server.close();
  }
});

test('login rejects invalid credentials', async () => {
  User.findOne = async () => ({
    comparePassword: async () => false
  });

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ayase@example.com',
        password: 'wrong-password'
      })
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Invalid credentials');
  } finally {
    await server.close();
  }
});

test('books list applies filters and sort parameters for catalog browsing', async () => {
  let capturedQuery;
  let capturedSort;

  Book.find = (query) => ({
    sort: async (sortOption) => {
      capturedQuery = query;
      capturedSort = sortOption;
      return [{
        _id: 'book-1',
        title: 'Clean Code',
        category: 'Technology',
        price: 25
      }];
    }
  });
  Book.countDocuments = async () => 1;

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(
      server.baseUrl,
      '/api/books?category=Technology&minPrice=10&maxPrice=30&sort=price_desc'
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.total, 1);
    assert.deepEqual(capturedQuery, {
      category: 'Technology',
      price: {
        $gte: 10,
        $lte: 30
      }
    });
    assert.deepEqual(capturedSort, { price: -1 });
  } finally {
    await server.close();
  }
});

test('book review updates average rating and review count', async () => {
  const protectedUser = makeProtectedUser();
  const book = {
    _id: 'book-1',
    title: 'Domain-Driven Design',
    reviews: [],
    ratings: {
      average: 0,
      count: 0
    },
    save: async function save() {
      return this;
    }
  };

  User.findById = () => protectedUser;
  Book.findById = async () => book;

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(server.baseUrl, '/api/books/book-1/review', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        rating: 5,
        comment: 'Excellent'
      })
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(book.reviews.length, 1);
    assert.equal(book.ratings.average, 5);
    assert.equal(book.ratings.count, 1);
  } finally {
    await server.close();
  }
});

test('cart add increments quantity when the book is already present', async () => {
  const protectedUser = makeProtectedUser({
    cart: [{
      bookId: { toString: () => 'book-1' },
      quantity: 1
    }]
  });

  User.findById = () => protectedUser;
  Book.findById = async () => ({
    _id: 'book-1',
    stock: 10,
    price: 20
  });

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(server.baseUrl, '/api/cart', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        bookId: 'book-1',
        quantity: 2
      })
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(protectedUser.cart[0].quantity, 3);
  } finally {
    await server.close();
  }
});

test('order creation converts cart items into an order and clears the cart', async () => {
  const protectedUser = makeProtectedUser({
    cart: [{
      bookId: {
        _id: 'book-1',
        title: 'Refactoring',
        price: 30,
        stock: 4
      },
      quantity: 2
    }]
  });

  const stockUpdates = [];

  User.findById = () => protectedUser;
  Book.findByIdAndUpdate = async (bookId, update) => {
    stockUpdates.push({ bookId, update });
    return null;
  };
  Order.create = async (payload) => ({
    _id: 'order-1',
    ...payload
  });

  const server = await startServer(createTestApp());

  try {
    const response = await requestJson(server.baseUrl, '/api/orders', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        shippingAddress: {
          street: 'Abay 1',
          city: 'Kyzylorda',
          country: 'Kazakhstan'
        },
        paymentMethod: 'credit_card'
      })
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.order.totalAmount, 60);
    assert.equal(protectedUser.cart.length, 0);
    assert.equal(protectedUser.purchaseHistory.length, 1);
    assert.deepEqual(stockUpdates, [{
      bookId: 'book-1',
      update: {
        $inc: {
          stock: -2,
          purchaseCount: 2
        }
      }
    }]);
  } finally {
    await server.close();
  }
});
