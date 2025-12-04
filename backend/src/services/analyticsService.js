const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

/**
 * Analytics Service
 * Provides financial insights and analytics
 */
class AnalyticsService {
  /**
   * Get financial summary for a period
   */
  static async getFinancialSummary(userId, startDate, endDate) {
    try {
      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expenses;

      return {
        income,
        expenses,
        balance,
        transactionCount: transactions.length,
        incomeCount: transactions.filter(t => t.type === 'income').length,
        expenseCount: transactions.filter(t => t.type === 'expense').length,
      };
    } catch (error) {
      throw new Error(`Failed to get financial summary: ${error.message}`);
    }
  }

  /**
   * Get category-wise spending analysis
   */
  static async getCategoryAnalysis(userId, startDate, endDate) {
    try {
      const result = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
          },
        },
        {
          $sort: { total: -1 },
        },
      ]);

      const totalExpenses = result.reduce((sum, cat) => sum + cat.total, 0);

      return result.map(cat => ({
        category: cat._id,
        total: cat.total,
        count: cat.count,
        avgAmount: Math.round(cat.avgAmount * 100) / 100,
        percentage: totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0,
      }));
    } catch (error) {
      throw new Error(`Failed to get category analysis: ${error.message}`);
    }
  }

  /**
   * Get monthly trend data
   */
  static async getMonthlyTrend(userId, year) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const result = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.month': 1 },
        },
      ]);

      // Format data for each month
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        const incomeData = result.find(r => r._id.month === month && r._id.type === 'income');
        const expenseData = result.find(r => r._id.month === month && r._id.type === 'expense');

        monthlyData.push({
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
          income: incomeData ? incomeData.total : 0,
          expenses: expenseData ? expenseData.total : 0,
          balance: (incomeData ? incomeData.total : 0) - (expenseData ? expenseData.total : 0),
        });
      }

      return monthlyData;
    } catch (error) {
      throw new Error(`Failed to get monthly trend: ${error.message}`);
    }
  }

  /**
   * Get weekly spending summary
   */
  static async getWeeklySummary(userId) {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const transactions = await Transaction.find({
        user: userId,
        type: 'expense',
        date: { $gte: weekAgo, $lte: today },
      }).sort({ date: -1 });

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const avgDaily = totalSpent / 7;

      // Group by day
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayTransactions = transactions.filter(
          t => t.date >= date && t.date < nextDay
        );

        const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

        dailyData.unshift({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleString('default', { weekday: 'short' }),
          total: dayTotal,
          count: dayTransactions.length,
        });
      }

      return {
        totalSpent,
        avgDaily: Math.round(avgDaily * 100) / 100,
        transactionCount: transactions.length,
        dailyData,
      };
    } catch (error) {
      throw new Error(`Failed to get weekly summary: ${error.message}`);
    }
  }

  /**
   * Get top expenses
   */
  static async getTopExpenses(userId, limit = 5) {
    try {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const topExpenses = await Transaction.find({
        user: userId,
        type: 'expense',
        date: { $gte: monthAgo, $lte: today },
      })
        .sort({ amount: -1 })
        .limit(limit)
        .select('title amount category date merchant');

      return topExpenses;
    } catch (error) {
      throw new Error(`Failed to get top expenses: ${error.message}`);
    }
  }

  /**
   * Get budget vs actual comparison
   */
  static async getBudgetComparison(userId, month, year) {
    try {
      const budgets = await Budget.find({
        user: userId,
        month,
        year,
        isActive: true,
      });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const expenses = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]);

      const comparison = budgets.map(budget => {
        const spent = expenses.find(e => e._id === budget.category);
        const spentAmount = spent ? spent.total : 0;
        const remaining = budget.amount - spentAmount;
        const percentage = (spentAmount / budget.amount) * 100;

        return {
          category: budget.category,
          budgeted: budget.amount,
          spent: spentAmount,
          remaining: Math.max(0, remaining),
          percentage: Math.round(percentage),
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good',
        };
      });

      return comparison;
    } catch (error) {
      throw new Error(`Failed to get budget comparison: ${error.message}`);
    }
  }

  /**
   * Get spending insights and recommendations
   */
  static async getInsights(userId) {
    try {
      const today = new Date();
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Current month data
      const thisMonthExpenses = await Transaction.find({
        user: userId,
        type: 'expense',
        date: { $gte: thisMonthStart, $lte: today },
      });

      // Last month data
      const lastMonthExpenses = await Transaction.find({
        user: userId,
        type: 'expense',
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });

      const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
      const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

      const insights = [];

      // Compare spending
      if (lastMonthTotal > 0) {
        const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (change > 20) {
          insights.push({
            type: 'warning',
            message: `Your spending is ${Math.round(change)}% higher than last month`,
          });
        } else if (change < -20) {
          insights.push({
            type: 'success',
            message: `Great! You've reduced spending by ${Math.round(Math.abs(change))}%`,
          });
        }
      }

      // Check top category
      const categoryTotals = {};
      thisMonthExpenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

      const topCategory = Object.keys(categoryTotals).reduce((a, b) =>
        categoryTotals[a] > categoryTotals[b] ? a : b
      , '');

      if (topCategory && thisMonthTotal > 0) {
        const percentage = (categoryTotals[topCategory] / thisMonthTotal) * 100;
        if (percentage > 40) {
          insights.push({
            type: 'info',
            message: `${topCategory} accounts for ${Math.round(percentage)}% of your spending`,
          });
        }
      }

      return insights;
    } catch (error) {
      throw new Error(`Failed to get insights: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;