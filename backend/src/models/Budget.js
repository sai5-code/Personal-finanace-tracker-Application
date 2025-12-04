const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide a budget amount'],
      min: [0, 'Budget amount cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    alertThreshold: {
      type: Number,
      default: 80, // Alert when 80% of budget is spent
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: {
      warningEmailSent: {
        type: Boolean,
        default: false,
      },
      criticalEmailSent: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique budget per category per period
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

// Virtual for percentage spent
budgetSchema.virtual('percentageSpent').get(function () {
  return this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
});

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.amount - this.spent);
});

// Virtual for status
budgetSchema.virtual('status').get(function () {
  const percentage = this.percentageSpent;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'good';
});

// Method to check if alert should be sent
budgetSchema.methods.shouldSendAlert = function () {
  const percentage = (this.spent / this.amount) * 100;
  
  if (percentage >= 100 && !this.notifications.criticalEmailSent) {
    return 'critical';
  }
  
  if (percentage >= this.alertThreshold && !this.notifications.warningEmailSent) {
    return 'warning';
  }
  
  return null;
};

// Static method to get all budgets with status
budgetSchema.statics.getBudgetsWithStatus = async function (userId, month, year) {
  const budgets = await this.find({
    user: userId,
    month,
    year,
    isActive: true,
  });

  return budgets.map(budget => ({
    ...budget.toObject(),
    percentageSpent: budget.percentageSpent,
    remaining: budget.remaining,
    status: budget.status,
  }));
};

// Enable virtuals in JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);