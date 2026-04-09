const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.bookId');
    
    const cartItems = user.cart.map(item => ({
      book: item.bookId,
      quantity: item.quantity,
      subtotal: item.bookId.price * item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      success: true,
      cart: cartItems,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const user = await User.findById(req.user._id);

    // Check if book already in cart
    const existingItem = user.cart.find(
      item => item.bookId.toString() === bookId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ bookId, quantity });
    }

    await user.save();
    await user.populate('cart.bookId');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/cart/:bookId
// @desc    Update cart item quantity
// @access  Private
router.put('/:bookId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cart.find(
      item => item.bookId.toString() === req.params.bookId
    );

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate('cart.bookId');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/cart/:bookId
// @desc    Remove item from cart
// @access  Private
router.delete('/:bookId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.cart = user.cart.filter(
      item => item.bookId.toString() !== req.params.bookId
    );

    await user.save();
    await user.populate('cart.bookId');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
