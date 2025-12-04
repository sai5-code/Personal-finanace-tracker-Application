const express = require('express');
const router = express.Router();
const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  refreshBudgets,
  getBudgetSuggestions,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.get('/status/summary', getBudgetStatus);
router.post('/refresh', refreshBudgets);
router.get('/suggestions', getBudgetSuggestions);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;