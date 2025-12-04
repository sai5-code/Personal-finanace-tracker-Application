const express = require('express');
const router = express.Router();
const {
  getFinancialSummary,
  getCategoryAnalysis,
  getMonthlyTrend,
  getWeeklySummary,
  getTopExpenses,
  getInsights,
  parseSMS,
  autoImportTransactions,
  getDashboardData,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/summary', getFinancialSummary);
router.get('/categories', getCategoryAnalysis);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/weekly-summary', getWeeklySummary);
router.get('/top-expenses', getTopExpenses);
router.get('/insights', getInsights);
router.get('/dashboard', getDashboardData);

router.post('/parse-sms', parseSMS);
router.post('/auto-import', autoImportTransactions);

module.exports = router;