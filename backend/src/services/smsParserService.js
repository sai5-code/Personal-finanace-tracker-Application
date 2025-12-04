/**
 * SMS/UPI Parser Service
 * Extracts transaction details from SMS/UPI messages
 */

class SMSParserService {
  /**
   * Parse SMS message to extract transaction details
   * @param {string} message - SMS message text
   * @returns {object|null} - Parsed transaction data or null
   */
  static parseSMS(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }

    const normalizedMessage = message.toLowerCase();

    // Check if it's a financial transaction message
    if (!this.isFinancialMessage(normalizedMessage)) {
      return null;
    }

    const transaction = {
      amount: this.extractAmount(message),
      merchant: this.extractMerchant(message),
      date: new Date(),
      type: this.extractTransactionType(normalizedMessage),
      paymentMethod: this.extractPaymentMethod(normalizedMessage),
      category: null,
    };

    // Auto-categorize based on merchant
    if (transaction.merchant) {
      transaction.category = this.autoCategorizeMerchant(transaction.merchant);
    }

    // Only return if we found at least an amount
    if (transaction.amount > 0) {
      return transaction;
    }

    return null;
  }

  /**
   * Check if message is a financial transaction
   */
  static isFinancialMessage(message) {
    const keywords = [
      'debited', 'credited', 'paid', 'received', 'sent',
      'upi', 'transaction', 'payment', 'transfer',
      'withdrawn', 'deposited', 'spent', 'refund'
    ];

    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Extract amount from message
   */
  static extractAmount(message) {
    // Patterns for amount extraction
    const patterns = [
      /(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs\.?|inr|rupees)/i,
      /(?:amount|amt).*?(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Remove commas and convert to number
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          return amount;
        }
      }
    }

    return 0;
  }

  /**
   * Extract merchant/payee name
   */
  static extractMerchant(message) {
    const patterns = [
      /(?:to|at|from)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+via|\s+for|\.|\s+rs)/i,
      /(?:paid to|sent to|received from)\s+([A-Za-z0-9\s]+?)(?:\s|$)/i,
      /vpa:\s*([^\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown';
  }

  /**
   * Extract transaction type (credit/debit)
   */
  static extractTransactionType(message) {
    const creditKeywords = ['credited', 'received', 'deposit', 'refund'];
    const debitKeywords = ['debited', 'paid', 'sent', 'withdrawn', 'spent'];

    if (creditKeywords.some(keyword => message.includes(keyword))) {
      return 'income';
    }

    if (debitKeywords.some(keyword => message.includes(keyword))) {
      return 'expense';
    }

    return 'expense'; // Default to expense
  }

  /**
   * Extract payment method
   */
  static extractPaymentMethod(message) {
    if (message.includes('upi')) return 'upi';
    if (message.includes('card')) return 'card';
    if (message.includes('atm')) return 'card';
    if (message.includes('cash')) return 'cash';
    if (message.includes('transfer') || message.includes('neft') || message.includes('imps')) {
      return 'bank_transfer';
    }

    return 'other';
  }

  /**
   * Auto-categorize based on merchant name
   */
  static autoCategorizeMerchant(merchant) {
    const merchantLower = merchant.toLowerCase();

    const categoryMap = {
      food: ['zomato', 'swiggy', 'mcdonald', 'kfc', 'domino', 'pizza', 'restaurant', 'cafe', 'starbucks'],
      shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'store', 'mall', 'shop'],
      travel: ['uber', 'ola', 'rapido', 'irctc', 'makemytrip', 'goibibo', 'flight', 'hotel'],
      entertainment: ['bookmyshow', 'netflix', 'spotify', 'prime', 'hotstar', 'movie'],
      bills: ['electricity', 'water', 'gas', 'internet', 'airtel', 'jio', 'vodafone'],
      groceries: ['bigbasket', 'grofers', 'blinkit', 'dunzo', 'supermarket'],
      healthcare: ['pharmacy', 'apollo', 'hospital', 'clinic', 'doctor'],
      transport: ['petrol', 'fuel', 'parking'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => merchantLower.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return 'Other';
  }

  /**
   * Parse multiple SMS messages
   */
  static parseMultipleSMS(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages
      .map(msg => this.parseSMS(msg))
      .filter(transaction => transaction !== null);
  }

  /**
   * Generate sample SMS messages for testing
   */
  static generateSampleSMS() {
    return [
      'Rs.450 debited from your account to ZOMATO on 15-Dec-23. Available balance: Rs.12,500',
      'Your UPI payment of Rs.1,200.00 to Amazon Pay via Google Pay is successful',
      'Rs.5000 credited to your account. Salary payment received. Current balance: Rs.45,000',
      'You have paid Rs.350 to OLA via UPI. Transaction ID: 1234567890',
      'Rs.2,500 debited for FLIPKART purchase. Card ending 1234. Date: 15/12/2023',
    ];
  }
}

module.exports = SMSParserService;