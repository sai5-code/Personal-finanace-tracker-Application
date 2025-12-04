const Receipt = require('../models/Receipt');
const Transaction = require('../models/Transaction');
const ReceiptOCRService = require('../services/receiptOCRService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/receipts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
  },
}).single('receipt');

/**
 * @desc    Upload and process receipt
 * @route   POST /api/receipts/upload
 * @access  Private
 */
exports.uploadReceipt = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a receipt image',
      });
    }

    try {
      const filePath = req.file.path;

      // Create receipt record
      const receipt = await Receipt.create({
        user: req.user._id,
        imageUrl: filePath,
        processingStatus: 'processing',
      });

      // Process receipt asynchronously
      processReceiptAsync(receipt._id, filePath);

      res.status(201).json({
        success: true,
        message: 'Receipt uploaded successfully. Processing in background.',
        data: receipt,
      });
    } catch (error) {
      console.error('Upload Receipt Error:', error);
      
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error uploading receipt',
        error: error.message,
      });
    }
  });
};

/**
 * Process receipt asynchronously
 */
async function processReceiptAsync(receiptId, filePath) {
  try {
    // Perform OCR
    const ocrResult = await ReceiptOCRService.processReceipt(filePath);

    // Upload to Cloudinary (optional)
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(filePath);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError.message);
    }

    // Update receipt with OCR results
    const receipt = await Receipt.findById(receiptId);
    
    if (cloudinaryResult) {
      receipt.imageUrl = cloudinaryResult.url;
      receipt.cloudinaryPublicId = cloudinaryResult.publicId;
    }

    receipt.extractedData = ocrResult.extractedData;
    receipt.processingStatus = ocrResult.success ? 'completed' : 'failed';
    
    if (!ocrResult.success) {
      receipt.processingError = ocrResult.error;
    }

    await receipt.save();

    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

  } catch (error) {
    console.error('Receipt processing error:', error);
    
    // Update receipt with error
    await Receipt.findByIdAndUpdate(receiptId, {
      processingStatus: 'failed',
      processingError: error.message,
    });

    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * @desc    Get all receipts for a user
 * @route   GET /api/receipts
 * @access  Private
 */
exports.getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts,
    });
  } catch (error) {
    console.error('Get Receipts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipts',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single receipt
 * @route   GET /api/receipts/:id
 * @access  Private
 */
exports.getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error('Get Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipt',
      error: error.message,
    });
  }
};

/**
 * @desc    Update receipt (manual corrections)
 * @route   PUT /api/receipts/:id
 * @access  Private
 */
exports.updateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    const { merchant, amount, date, category } = req.body;

    // Store manual corrections
    receipt.manualCorrections = {
      merchant: merchant || receipt.extractedData?.merchant,
      amount: amount || receipt.extractedData?.amount,
      date: date || receipt.extractedData?.date,
      category: category || receipt.extractedData?.category,
    };

    receipt.isVerified = true;
    receipt.verifiedBy = 'user';

    await receipt.save();

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: receipt,
    });
  } catch (error) {
    console.error('Update Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating receipt',
      error: error.message,
    });
  }
};

/**
 * @desc    Create transaction from receipt
 * @route   POST /api/receipts/:id/create-transaction
 * @access  Private
 */
exports.createTransactionFromReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    if (receipt.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction already created for this receipt',
      });
    }

    const finalData = receipt.getFinalData();

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'expense',
      title: `Receipt from ${finalData.merchant}`,
      amount: finalData.amount,
      category: finalData.category,
      date: finalData.date,
      merchant: finalData.merchant,
      sourceType: 'receipt',
      receiptId: receipt._id,
    });

    // Link transaction to receipt
    receipt.transactionId = transaction._id;
    await receipt.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created from receipt',
      data: transaction,
    });
  } catch (error) {
    console.error('Create Transaction from Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction from receipt',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete receipt
 * @route   DELETE /api/receipts/:id
 * @access  Private
 */
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    // Delete from Cloudinary if exists
    if (receipt.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(receipt.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete failed:', cloudinaryError.message);
      }
    }

    await receipt.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error) {
    console.error('Delete Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting receipt',
      error: error.message,
    });
  }
};