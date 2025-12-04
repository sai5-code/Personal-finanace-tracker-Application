const Transaction = require('../models/Transaction');
const BudgetService = require('../services/budgetService');

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
  try {
    const { type, title, amount, category, description, date, paymentMethod, merchant, tags } = req.body;

    // Validation
    if (!type || !title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, title, amount, and category',
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      title,
      amount,
      category,
      description,
      date: date || new Date(),
      paymentMethod,
      merchant,
      tags,
      sourceType: 'manual',
    });

    // Update budget if it's an expense
    if (type === 'expense') {
      const transactionDate = new Date(date || new Date());
      await BudgetService.updateBudgetSpent(
        req.user._id,
        category,
        transactionDate.getMonth() + 1,
        transactionDate.getFullYear()
      );
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all transactions for a user
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build query
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions,
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const oldCategory = transaction.category;
    const oldType = transaction.type;
    const oldDate = transaction.date;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    // Update budgets if category, type, or date changed
    if (oldType === 'expense') {
      await BudgetService.updateBudgetSpent(
        req.user._id,
        oldCategory,
        oldDate.getMonth() + 1,
        oldDate.getFullYear()
      );
    }

    if (transaction.type === 'expense') {
      await BudgetService.updateBudgetSpent(
        req.user._id,
        transaction.category,
        transaction.date.getMonth() + 1,
        transaction.date.getFullYear()
      );
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Update Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const { category, type, date } = transaction;

    await transaction.deleteOne();

    // Update budget if it was an expense
    if (type === 'expense') {
      await BudgetService.updateBudgetSpent(
        req.user._id,
        category,
        date.getMonth() + 1,
        date.getFullYear()
      );
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Get transaction summary
 * @route   GET /api/transactions/summary
 * @access  Private
 */
exports.getTransactionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Transaction.getSummary(req.user._id, start, end);

    const income = summary.find(s => s._id === 'income');
    const expense = summary.find(s => s._id === 'expense');

    res.status(200).json({
      success: true,
      data: {
        income: income ? income.total : 0,
        incomeCount: income ? income.count : 0,
        expenses: expense ? expense.total : 0,
        expenseCount: expense ? expense.count : 0,
        balance: (income ? income.total : 0) - (expense ? expense.total : 0),
        period: { startDate: start, endDate: end },
      },
    });
  } catch (error) {
    console.error('Get Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction summary',
      error: error.message,
    });
  }
};