const Tesseract = require('tesseract.js');

/**
 * Receipt OCR Service
 * Extracts text and data from receipt images
 */
class ReceiptOCRService {
  /**
   * Process receipt image and extract data
   * @param {string} imagePath - Path to the receipt image
   * @returns {Promise<object>} - Extracted receipt data
   */
  static async processReceipt(imagePath) {
    try {
      // Perform OCR on the image
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: info => console.log('OCR Progress:', info.status, info.progress),
        }
      );

      // Extract structured data from OCR text
      const extractedData = this.extractReceiptData(text);

      return {
        success: true,
        rawText: text,
        extractedData,
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        success: false,
        error: error.message,
        rawText: '',
        extractedData: null,
      };
    }
  }

  /**
   * Extract structured data from OCR text
   * @param {string} text - Raw OCR text
   * @returns {object} - Structured receipt data
   */
  static extractReceiptData(text) {
    const data = {
      merchant: this.extractMerchant(text),
      amount: this.extractAmount(text),
      date: this.extractDate(text),
      items: this.extractItems(text),
      category: null,
    };

    // Auto-categorize based on merchant
    if (data.merchant) {
      data.category = this.autoCategorizeMerchant(data.merchant);
    }

    return data;
  }

  /**
   * Extract merchant name from text
   */
  static extractMerchant(text) {
    const lines = text.split('\n');
    
    // Usually merchant name is in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Look for lines with capital letters and reasonable length
      if (line.length > 3 && line.length < 50 && /[A-Z]/.test(line)) {
        // Exclude common receipt terms
        const excludeTerms = ['receipt', 'invoice', 'bill', 'tax', 'total', 'date'];
        if (!excludeTerms.some(term => line.toLowerCase().includes(term))) {
          return line;
        }
      }
    }

    return 'Unknown Merchant';
  }

  /**
   * Extract total amount from text
   */
  static extractAmount(text) {
    const patterns = [
      /total[:\s]*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /grand\s*total[:\s]*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /amount[:\s]*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(?:rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          return amount;
        }
      }
    }

    return 0;
  }

  /**
   * Extract date from text
   */
  static extractDate(text) {
    const patterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // DD/MM/YY or DD-MM-YY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      // YYYY-MM-DD
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      // Month DD, YYYY
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          let date;
          if (match[0].includes('jan') || match[0].includes('Jan')) {
            // Handle month name format
            date = new Date(match[0]);
          } else {
            // Handle numeric formats
            const parts = match[0].split(/[\/\-]/);
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              // DD-MM-YYYY
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          }
          
          if (date instanceof Date && !isNaN(date)) {
            return date;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return new Date(); // Default to current date
  }

  /**
   * Extract line items from text
   */
  static extractItems(text) {
    const items = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Look for lines with item name and price
      const match = line.match(/(.+?)\s+(?:rs\.?|₹)?\s*(\d+(?:\.\d{2})?)/i);
      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2]);

        // Filter out total lines
        if (!name.toLowerCase().includes('total') && 
            !name.toLowerCase().includes('tax') &&
            price > 0 && price < 10000) {
          items.push({
            name,
            price,
            quantity: 1,
          });
        }
      }
    }

    return items;
  }

  /**
   * Auto-categorize based on merchant
   */
  static autoCategorizeMerchant(merchant) {
    const merchantLower = merchant.toLowerCase();

    const categoryMap = {
      food: ['restaurant', 'cafe', 'hotel', 'bistro', 'kitchen', 'pizza', 'burger', 'food'],
      groceries: ['supermarket', 'mart', 'grocery', 'store', 'fresh', 'bazaar'],
      shopping: ['fashion', 'mall', 'boutique', 'store', 'shop', 'retail'],
      healthcare: ['pharmacy', 'medical', 'hospital', 'clinic', 'health', 'care'],
      entertainment: ['cinema', 'theatre', 'multiplex', 'pvr', 'inox'],
      transport: ['petrol', 'fuel', 'gas', 'station'],
      bills: ['electricity', 'water', 'utility'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => merchantLower.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return 'Other';
  }

  /**
   * Validate extracted data
   */
  static validateExtractedData(data) {
    const errors = [];

    if (!data.merchant || data.merchant === 'Unknown Merchant') {
      errors.push('Merchant name could not be detected');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount could not be detected');
    }

    if (!data.date) {
      errors.push('Date could not be detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = ReceiptOCRService;