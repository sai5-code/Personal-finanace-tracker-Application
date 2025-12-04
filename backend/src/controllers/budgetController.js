const Budget = require('../models/Budget');
const BudgetService = require('../services/budgetService');

/**
 * @desc    Create a new budget
 * @route   POST /api/budgets
 * @access  Private
 */
exports.createBudget = async (req, res) => {
  try {
    const { category, amount, period, month, year, alertThreshold } = req.body;

    // Validation
    if (!category || !amount || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, amount, month, and year',
      });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      amount,
      period: period || 'monthly',
      month,
      year,
      alertThreshold: alertThreshold || 80,
    });

    // Update spent amount based on existing transactions
    await BudgetService.updateBudgetSpent(req.user._id, category, month, year);

    // Fetch updated budget
    const updatedBudget = await Budget.findById(budget._id);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: updatedBudget,
    });
  } catch (error) {
    console.error('Create Budget Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Budget for this category already exists for the specified period',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating budget',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all budgets for a user
 * @route   GET /api/budgets
 * @access  Private
 */
exports.getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month/year if not provided
    const currentDate = new Date();
    const searchMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const searchYear = year ? parseInt(year) : currentDate.getFullYear();

    const budgets = await Budget.find({
      user: req.user._id,
      month: searchMonth,
      year: searchYear,
      isActive: true,
    }).sort({ category: 1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    console.error('Get Budgets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single budget
 * @route   GET /api/budgets/:id
 * @access  Private
 */
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Get Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget',
      error: error.message,
    });
  }
};

/**
 * @desc    Update budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
exports.updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget,
    });
  } catch (error) {
    console.error('Update Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating budget',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Delete Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget',
      error: error.message,
    });
  }
};

/**
 * @desc    Get budget status
 * @route   GET /api/budgets/status/summary
 * @access  Private
 */
exports.getBudgetStatus = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();
    const searchMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const searchYear = year ? parseInt(year) : currentDate.getFullYear();

    const status = await BudgetService.getBudgetStatus(
      req.user._id,
      searchMonth,
      searchYear
    );

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get Budget Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget status',
      error: error.message,
    });
  }
};

/**
 * @desc    Refresh budget spent amounts
 * @route   POST /api/budgets/refresh
 * @access  Private
 */
exports.refreshBudgets = async (req, res) => {
  try {
    const { month, year } = req.body;

    const currentDate = new Date();
    const searchMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const searchYear = year ? parseInt(year) : currentDate.getFullYear();

    const result = await BudgetService.updateAllBudgets(
      req.user._id,
      searchMonth,
      searchYear
    );

    res.status(200).json({
      success: true,
      message: 'Budgets refreshed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Refresh Budgets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing budgets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get budget suggestions
 * @route   GET /api/budgets/suggestions
 * @access  Private
 */
exports.getBudgetSuggestions = async (req, res) => {
  try {
    const suggestions = await BudgetService.suggestBudgets(req.user._id);

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    console.error('Get Budget Suggestions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget suggestions',
      error: error.message,
    });
  }
};