const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/books
// @desc    Get all books with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { 'ratings.average': -1 };
    if (sort === 'popular') sortOption = { purchaseCount: -1 };

    const books = await Book.find(query).sort(sortOption);
    const count = await Book.countDocuments(query);

    res.json({
      success: true,
      books,
      totalPages: 1,
      currentPage: 1,
      total: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/books/:id
// @desc    Get single book
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Increment view count
    book.viewCount += 1;
    await book.save();

    // Track view in user history if logged in
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await User.findByIdAndUpdate(decoded.id, {
          $push: {
            viewedBooks: {
              $each: [{ bookId: book._id, viewedAt: new Date() }],
              $slice: -50 // Keep last 50 viewed books
            }
          }
        });
      } catch (err) {
        // Silent fail for view tracking
      }
    }

    res.json({ success: true, book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/books
// @desc    Create a new book
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/books/:id
// @desc    Update a book
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/books/:id/like
// @desc    Like/Unlike a book
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const bookId = req.params.id;

    const likeIndex = user.likedBooks.indexOf(bookId);
    
    if (likeIndex > -1) {
      user.likedBooks.splice(likeIndex, 1);
    } else {
      user.likedBooks.push(bookId);
    }

    await user.save();

    res.json({ success: true, liked: likeIndex === -1, likedBooks: user.likedBooks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/books/:id/review
// @desc    Add a review to a book
// @access  Private
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if user already reviewed
    const existingReview = book.reviews.find(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this book' });
    }

    book.reviews.push({
      userId: req.user._id,
      rating,
      comment
    });

    // Update average rating
    const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
    book.ratings.average = totalRating / book.reviews.length;
    book.ratings.count = book.reviews.length;

    await book.save();

    res.json({ success: true, book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/books/categories/list
// @desc    Get all unique categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Book.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;