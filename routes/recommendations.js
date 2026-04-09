const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const RecommendationEngine = require('../utils/recommendationEngine');

// @route   GET /api/recommendations/for-you
// @desc    Get personalized recommendations for user
// @access  Private
router.get('/for-you', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getHybridRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/recommendations/user-based
// @desc    Get user-based collaborative filtering recommendations
// @access  Private
router.get('/user-based', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getUserBasedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      method: 'User-based Collaborative Filtering',
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/recommendations/item-based
// @desc    Get item-based collaborative filtering recommendations
// @access  Private
router.get('/item-based', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getItemBasedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      method: 'Item-based Collaborative Filtering',
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/recommendations/content-based
// @desc    Get content-based recommendations
// @access  Private
router.get('/content-based', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getContentBasedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      method: 'Content-based Filtering',
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/recommendations/popular
// @desc    Get popular books
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getPopularBooks(parseInt(limit));

    res.json({
      success: true,
      recommendations,
      method: 'Popular Books',
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/recommendations/view-based
// @desc    Get recommendations based on viewed books
// @access  Private
router.get('/view-based', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getViewBasedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      method: 'View-based Recommendations',
      count: recommendations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
