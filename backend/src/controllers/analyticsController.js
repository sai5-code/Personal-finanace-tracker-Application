const AnalyticsService = require('../services/analyticsService');
const SMSParserService = require('../services/smsParserService');
const Transaction = require('../models/Transaction');

/**
 * @desc    Get financial summary
 * @route   GET /api/analytics/summary
 * @access  Private
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to current month if not provided
    const start = startDate 
      ? new Date(startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const end = endDate 
      ? new Date(endDate) 
      : new Date();

    const summary = await AnalyticsService.getFinancialSummary(
      req.user._id,
      start,
      end
    );

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        period: { startDate: start, endDate: end },
      },
    });
  } catch (error) {
    console.error('Get Financial Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message,
    });
  }
};

/**
 * @desc    Get category analysis
 * @route   GET /api/analytics/categories
 * @access  Private
 */
exports.getCategoryAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate 
      ? new Date(startDate) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const end = endDate 
      ? new Date(endDate) 
      : new Date();

    const analysis = await AnalyticsService.getCategoryAnalysis(
      req.user._id,
      start,
      end
    );

    res.status(200).json({
      success: true,
      count: analysis.length,
      data: analysis,
    });
  } catch (error) {
    console.error('Get Category Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category analysis',
      error: error.message,
    });
  }
};

/**
 * @desc    Get monthly trend
 * @route   GET /api/analytics/monthly-trend
 * @access  Private
 */
exports.getMonthlyTrend = async (req, res) => {
  try {
    const { year } = req.query;
    const searchYear = year ? parseInt(year) : new Date().getFullYear();

    const trend = await AnalyticsService.getMonthlyTrend(
      req.user._id,
      searchYear
    );

    res.status(200).json({
      success: true,
      year: searchYear,
      data: trend,
    });
  } catch (error) {
    console.error('Get Monthly Trend Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly trend',
      error: error.message,
    });
  }
};

/**
 * @desc    Get weekly summary
 * @route   GET /api/analytics/weekly-summary
 * @access  Private
 */
exports.getWeeklySummary = async (req, res) => {
  try {
    const summary = await AnalyticsService.getWeeklySummary(req.user._id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get Weekly Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly summary',
      error: error.message,
    });
  }
};

/**
 * @desc    Get top expenses
 * @route   GET /api/analytics/top-expenses
 * @access  Private
 */
exports.getTopExpenses = async (req, res) => {
  try {
    const { limit } = req.query;
    const topExpenses = await AnalyticsService.getTopExpenses(
      req.user._id,
      limit ? parseInt(limit) : 5
    );

    res.status(200).json({
      success: true,
      count: topExpenses.length,
      data: topExpenses,
    });
  } catch (error) {
    console.error('Get Top Expenses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top expenses',
      error: error.message,
    });
  }
};

/**
 * @desc    Get spending insights
 * @route   GET /api/analytics/insights
 * @access  Private
 */
exports.getInsights = async (req, res) => {
  try {
    const insights = await AnalyticsService.getInsights(req.user._id);

    res.status(200).json({
      success: true,
      count: insights.length,
      data: insights,
    });
  } catch (error) {
    console.error('Get Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights',
      error: error.message,
    });
  }
};

/**
 * @desc    Parse SMS messages
 * @route   POST /api/analytics/parse-sms
 * @access  Private
 */
exports.parseSMS = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of SMS messages',
      });
    }

    const parsed = SMSParserService.parseMultipleSMS(messages);

    res.status(200).json({
      success: true,
      count: parsed.length,
      data: parsed,
    });
  } catch (error) {
    console.error('Parse SMS Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error parsing SMS messages',
      error: error.message,
    });
  }
};

/**
 * @desc    Auto-detect and import transactions from SMS
 * @route   POST /api/analytics/auto-import
 * @access  Private
 */
exports.autoImportTransactions = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of SMS messages',
      });
    }

    const parsed = SMSParserService.parseMultipleSMS(messages);

    // Create transactions from parsed SMS
    const transactions = [];
    for (const data of parsed) {
      const transaction = await Transaction.create({
        user: req.user._id,
        type: data.type,
        title: `${data.type === 'income' ? 'Received from' : 'Paid to'} ${data.merchant}`,
        amount: data.amount,
        category: data.category || 'Other',
        date: data.date,
        merchant: data.merchant,
        paymentMethod: data.paymentMethod,
        isAutoDetected: true,
        sourceType: 'sms',
      });
      transactions.push(transaction);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${transactions.length} transactions`,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Auto Import Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-importing transactions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get dashboard data (comprehensive)
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
exports.getDashboardData = async (req, res) => {
  try {
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get all data in parallel
    const [summary, categoryAnalysis, weeklySummary, topExpenses, insights] = await Promise.all([
      AnalyticsService.getFinancialSummary(req.user._id, monthStart, monthEnd),
      AnalyticsService.getCategoryAnalysis(req.user._id, monthStart, monthEnd),
      AnalyticsService.getWeeklySummary(req.user._id),
      AnalyticsService.getTopExpenses(req.user._id, 5),
      AnalyticsService.getInsights(req.user._id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary,
        categoryAnalysis,
        weeklySummary,
        topExpenses,
        insights,
      },
    });
  } catch (error) {
    console.error('Get Dashboard Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};