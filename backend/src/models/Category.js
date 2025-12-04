const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      maxlength: [50, 'Category name cannot be more than 50 characters'],
    },
    icon: {
      type: String,
      default: '📁',
    },
    color: {
      type: String,
      default: '#4c8bf5',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      default: 'expense',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Keywords for auto-categorization
    keywords: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    // Statistics
    transactionCount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique category per user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Method to update statistics
categorySchema.methods.updateStats = async function () {
  const Transaction = mongoose.model('Transaction');
  
  const stats = await Transaction.aggregate([
    {
      $match: {
        user: this.user,
        category: this.name,
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
  ]);

  if (stats.length > 0) {
    this.transactionCount = stats[0].count;
    this.totalAmount = stats[0].total;
    await this.save();
  }
};

// Static method to get or create default categories
categorySchema.statics.createDefaultCategories = async function (userId) {
  const defaultCategories = [
    { name: 'Food', icon: '🍕', color: '#ef4444', type: 'expense', keywords: ['food', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast'] },
    { name: 'Shopping', icon: '🛍️', color: '#f59e0b', type: 'expense', keywords: ['shopping', 'amazon', 'flipkart', 'store'] },
    { name: 'Travel', icon: '✈️', color: '#3b82f6', type: 'expense', keywords: ['travel', 'flight', 'hotel', 'uber', 'ola', 'taxi'] },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', keywords: ['movie', 'entertainment', 'netflix', 'spotify', 'games'] },
    { name: 'Bills', icon: '📄', color: '#ef4444', type: 'expense', keywords: ['bill', 'electricity', 'water', 'internet', 'phone'] },
    { name: 'Healthcare', icon: '🏥', color: '#10b981', type: 'expense', keywords: ['health', 'doctor', 'medicine', 'hospital', 'pharmacy'] },
    { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense', keywords: ['education', 'course', 'book', 'school', 'college'] },
    { name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense', keywords: ['grocery', 'supermarket', 'vegetables', 'fruits'] },
    { name: 'Transport', icon: '🚗', color: '#06b6d4', type: 'expense', keywords: ['transport', 'petrol', 'gas', 'parking'] },
    { name: 'Salary', icon: '💰', color: '#10b981', type: 'income', keywords: ['salary', 'wage', 'payment'] },
    { name: 'Investment', icon: '📈', color: '#3b82f6', type: 'income', keywords: ['investment', 'dividend', 'interest'] },
    { name: 'Other', icon: '📦', color: '#6b7280', type: 'both', keywords: [] },
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId,
    isDefault: true,
  }));

  try {
    await this.insertMany(categories, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors
    if (error.code !== 11000) {
      throw error;
    }
  }
};

module.exports = mongoose.model('Category', categorySchema);