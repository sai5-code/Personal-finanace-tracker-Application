const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Receipt image URL is required'],
    },
    cloudinaryPublicId: {
      type: String,
    },
    // Extracted data from OCR
    extractedData: {
      merchant: {
        type: String,
        trim: true,
      },
      amount: {
        type: Number,
        min: 0,
      },
      date: {
        type: Date,
      },
      category: {
        type: String,
        trim: true,
      },
      items: [{
        name: String,
        quantity: Number,
        price: Number,
      }],
      rawText: {
        type: String,
      },
    },
    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: String,
      enum: ['user', 'auto'],
    },
    // Processing status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
    },
    // Linked transaction
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    // Manual corrections
    manualCorrections: {
      merchant: String,
      amount: Number,
      date: Date,
      category: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
receiptSchema.index({ user: 1, createdAt: -1 });
receiptSchema.index({ processingStatus: 1 });

// Method to get final data (extracted + manual corrections)
receiptSchema.methods.getFinalData = function () {
  return {
    merchant: this.manualCorrections?.merchant || this.extractedData?.merchant || '',
    amount: this.manualCorrections?.amount || this.extractedData?.amount || 0,
    date: this.manualCorrections?.date || this.extractedData?.date || new Date(),
    category: this.manualCorrections?.category || this.extractedData?.category || 'Other',
  };
};

// Static method to get pending receipts
receiptSchema.statics.getPendingReceipts = async function (userId) {
  return await this.find({
    user: userId,
    processingStatus: { $in: ['pending', 'processing'] },
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Receipt', receiptSchema);