const User = require('../models/User');
const Book = require('../models/Book');

class RecommendationEngine {
  
  // Calculate similarity between two users based on their purchase history
  static calculateUserSimilarity(user1Purchases, user2Purchases) {
    const user1Books = new Set(user1Purchases.map(p => p.bookId.toString()));
    const user2Books = new Set(user2Purchases.map(p => p.bookId.toString()));
    
    const intersection = new Set([...user1Books].filter(x => user2Books.has(x)));
    const union = new Set([...user1Books, ...user2Books]);
    
    // Jaccard similarity
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  // User-based collaborative filtering
  static async getUserBasedRecommendations(userId, limit = 10) {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) return [];

      const currentUserBooks = new Set([
        ...currentUser.purchaseHistory.map(p => p.bookId.toString()),
        ...currentUser.likedBooks.map(b => b.toString())
      ]);

      // Get all users with purchase history
      const allUsers = await User.find({
        _id: { $ne: userId },
        'purchaseHistory.0': { $exists: true }
      }).select('purchaseHistory likedBooks');

      // Calculate similarity with other users
      const similarities = allUsers.map(user => ({
        userId: user._id,
        similarity: this.calculateUserSimilarity(
          currentUser.purchaseHistory,
          user.purchaseHistory
        ),
        books: [
          ...user.purchaseHistory.map(p => p.bookId),
          ...user.likedBooks
        ]
      })).filter(s => s.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Top 10 similar users

      // Collect recommended books from similar users
      const bookScores = {};
      similarities.forEach(sim => {
        sim.books.forEach(bookId => {
          const bookIdStr = bookId.toString();
          if (!currentUserBooks.has(bookIdStr)) {
            bookScores[bookIdStr] = (bookScores[bookIdStr] || 0) + sim.similarity;
          }
        });
      });

      // Sort books by score
      const recommendedBookIds = Object.entries(bookScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([bookId]) => bookId);

      const books = await Book.find({ _id: { $in: recommendedBookIds } });
      return books;
    } catch (error) {
      console.error('Error in user-based recommendations:', error);
      return [];
    }
  }

  // Item-based collaborative filtering
  static async getItemBasedRecommendations(userId, limit = 10) {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser || currentUser.purchaseHistory.length === 0) {
        return await this.getPopularBooks(limit);
      }

      // Get books the user has interacted with
      const userBookIds = currentUser.purchaseHistory.map(p => p.bookId);
      
      // Find users who bought similar books
      const similarUsers = await User.find({
        _id: { $ne: userId },
        'purchaseHistory.bookId': { $in: userBookIds }
      }).select('purchaseHistory');

      const currentUserBooks = new Set(userBookIds.map(id => id.toString()));
      const bookScores = {};

      similarUsers.forEach(user => {
        user.purchaseHistory.forEach(purchase => {
          const bookIdStr = purchase.bookId.toString();
          if (!currentUserBooks.has(bookIdStr)) {
            bookScores[bookIdStr] = (bookScores[bookIdStr] || 0) + 1;
          }
        });
      });

      const recommendedBookIds = Object.entries(bookScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([bookId]) => bookId);

      const books = await Book.find({ _id: { $in: recommendedBookIds } });
      return books;
    } catch (error) {
      console.error('Error in item-based recommendations:', error);
      return [];
    }
  }

  // Content-based recommendations based on category
  static async getContentBasedRecommendations(userId, limit = 10) {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser || currentUser.purchaseHistory.length === 0) {
        return await this.getPopularBooks(limit);
      }

      const userBooks = await Book.find({
        _id: { $in: currentUser.purchaseHistory.map(p => p.bookId) }
      });

      // Get favorite categories
      const categoryCount = {};
      userBooks.forEach(book => {
        categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      const currentUserBookIds = userBooks.map(b => b._id.toString());

      const recommendations = await Book.find({
        category: { $in: topCategories },
        _id: { $nin: currentUserBookIds }
      })
        .sort({ ratings: -1, purchaseCount: -1 })
        .limit(limit);

      return recommendations;
    } catch (error) {
      console.error('Error in content-based recommendations:', error);
      return [];
    }
  }

  // Hybrid recommendation combining multiple strategies
  static async getHybridRecommendations(userId, limit = 10) {
    try {
      const [userBased, itemBased, contentBased] = await Promise.all([
        this.getUserBasedRecommendations(userId, 5),
        this.getItemBasedRecommendations(userId, 5),
        this.getContentBasedRecommendations(userId, 5)
      ]);

      // Combine and deduplicate
      const bookMap = new Map();
      [...userBased, ...itemBased, ...contentBased].forEach(book => {
        if (!bookMap.has(book._id.toString())) {
          bookMap.set(book._id.toString(), book);
        }
      });

      return Array.from(bookMap.values()).slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      return [];
    }
  }

  // Get popular books for new users
  static async getPopularBooks(limit = 10) {
    try {
      return await Book.find({ stock: { $gt: 0 } })
        .sort({ purchaseCount: -1, 'ratings.average': -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting popular books:', error);
      return [];
    }
  }

  // Get recommendations based on viewed books
  static async getViewBasedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      if (!user || user.viewedBooks.length === 0) {
        return await this.getPopularBooks(limit);
      }

      const viewedBookIds = user.viewedBooks.map(v => v.bookId);
      const viewedBooks = await Book.find({ _id: { $in: viewedBookIds } });

      const categories = [...new Set(viewedBooks.map(b => b.category))];
      
      const recommendations = await Book.find({
        category: { $in: categories },
        _id: { $nin: viewedBookIds }
      })
        .sort({ 'ratings.average': -1 })
        .limit(limit);

      return recommendations;
    } catch (error) {
      console.error('Error in view-based recommendations:', error);
      return [];
    }
  }
}

module.exports = RecommendationEngine;
