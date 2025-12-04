const express = require('express');
const router = express.Router();
const {
  uploadReceipt,
  getReceipts,
  getReceipt,
  updateReceipt,
  createTransactionFromReceipt,
  deleteReceipt,
} = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter, ocrLimiter } = require('../middleware/rateLimiter');

// All routes are protected
router.use(protect);

router.post('/upload', uploadLimiter, ocrLimiter, uploadReceipt);
router.get('/', getReceipts);

router.route('/:id')
  .get(getReceipt)
  .put(updateReceipt)
  .delete(deleteReceipt);

router.post('/:id/create-transaction', createTransactionFromReceipt);

module.exports = router;