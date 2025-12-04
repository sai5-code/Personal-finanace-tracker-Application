const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

/**
 * Budget Service
 * Handles budget calculations and tracking
 */
class BudgetService {
  /**
   * Update budget spent amount based on transactions
   */
  static async updateBudgetSpent(userId, category, month, year) {
    try {
      const budget = await Budget.findOne({
        user: userId,
        category,
        month,
        year,
        isActive: true,
      });

      if (!budget) {
        return null;
      }

      // Calculate spent amount from transactions
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await Transaction.find({
        user: userId,
        type: 'expense',
        category,
        date: { $gte: startDate, $lte: endDate },
      });

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

      budget.spent = totalSpent;
      await budget.save();

      return budget;
    } catch (error) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }
  }

  /**
   * Update all budgets for a user
   */
  static async updateAllBudgets(userId, month, year) {
    try {
      const budgets = await Budget.find({
        user: userId,
        month,
        year,
        isActive: true,
      });

      const updatePromises = budgets.map(budget =>
        this.updateBudgetSpent(userId, budget.category, month, year)
      );

      await Promise.all(updatePromises);

      return { success: true, updatedCount: budgets.length };
    } catch (error) {
      throw new Error(`Failed to update all budgets: ${error.message}`);
    }
  }

  /**
   * Check if budget alerts should be sent
   */
  static async checkBudgetAlerts(userId, month, year) {
    try {
      const budgets = await Budget.find({
        user: userId,
        month,
        year,
        isActive: true,
      });

      const alerts = [];

      for (const budget of budgets) {
        const alertType = budget.shouldSendAlert();

        if (alertType) {
          alerts.push({
            budgetId: budget._id,
            category: budget.category,
            type: alertType,
            spent: budget.spent,
            amount: budget.amount,
            percentage: (budget.spent / budget.amount) * 100,
          });

          // Mark alert as sent
          if (alertType === 'warning') {
            budget.notifications.warningEmailSent = true;
          } else if (alertType === 'critical') {
            budget.notifications.criticalEmailSent = true;
          }
          await budget.save();
        }
      }

      return alerts;
    } catch (error) {
      throw new Error(`Failed to check budget alerts: ${error.message}`);
    }
  }

  /**
   * Get budget status summary
   */
  static async getBudgetStatus(userId, month, year) {
    try {
      const budgets = await Budget.find({
        user: userId,
        month,
        year,
        isActive: true,
      });

      const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

      const status = {
        totalBudgeted,
        totalSpent,
        totalRemaining: Math.max(0, totalBudgeted - totalSpent),
        percentageSpent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
        budgetCount: budgets.length,
        exceededCount: budgets.filter(b => b.spent >= b.amount).length,
        warningCount: budgets.filter(b => {
          const percentage = (b.spent / b.amount) * 100;
          return percentage >= b.alertThreshold && percentage < 100;
        }).length,
        goodCount: budgets.filter(b => {
          const percentage = (b.spent / b.amount) * 100;
          return percentage < b.alertThreshold;
        }).length,
      };

      return status;
    } catch (error) {
      throw new Error(`Failed to get budget status: ${error.message}`);
    }
  }

  /**
   * Create budgets for next month based on current month
   */
  static async createNextMonthBudgets(userId, currentMonth, currentYear) {
    try {
      const currentBudgets = await Budget.find({
        user: userId,
        month: currentMonth,
        year: currentYear,
        isActive: true,
      });

      if (currentBudgets.length === 0) {
        return { success: false, message: 'No current budgets found' };
      }

      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      const newBudgets = currentBudgets.map(budget => ({
        user: userId,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        month: nextMonth,
        year: nextYear,
        alertThreshold: budget.alertThreshold,
        isActive: true,
        spent: 0,
      }));

      await Budget.insertMany(newBudgets, { ordered: false });

      return {
        success: true,
        message: `Created ${newBudgets.length} budgets for next month`,
        count: newBudgets.length,
      };
    } catch (error) {
      if (error.code === 11000) {
        return { success: false, message: 'Next month budgets already exist' };
      }
      throw new Error(`Failed to create next month budgets: ${error.message}`);
    }
  }

  /**
   * Suggest budget amounts based on past spending
   */
  static async suggestBudgets(userId) {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const expenses = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: threeMonthsAgo },
          },
        },
        {
          $group: {
            _id: '$category',
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
      ]);

      const suggestions = expenses.map(exp => ({
        category: exp._id,
        suggestedAmount: Math.ceil(exp.avgAmount * 1.1), // 10% buffer
        avgSpent: Math.round(exp.avgAmount),
        maxSpent: exp.maxAmount,
        transactionCount: exp.count,
      }));

      return suggestions;
    } catch (error) {
      throw new Error(`Failed to suggest budgets: ${error.message}`);
    }
  }
}

module.exports = BudgetService;