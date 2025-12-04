/**
 * Category matching rules for auto-categorization
 */
const categoryRules = {
  food: {
    keywords: [
      'zomato', 'swiggy', 'uber eats', 'foodpanda',
      'mcdonald', 'kfc', 'domino', 'pizza', 'burger',
      'restaurant', 'cafe', 'starbucks', 'dunkin',
      'food', 'dining', 'lunch', 'dinner', 'breakfast'
    ],
    patterns: [
      /restaurant/i,
      /cafe/i,
      /food/i,
      /dining/i
    ]
  },

  shopping: {
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho',
      'nykaa', 'tata cliq', 'shopping', 'store', 'mall',
      'fashion', 'clothes', 'apparel'
    ],
    patterns: [
      /shop/i,
      /store/i,
      /mall/i,
      /retail/i
    ]
  },

  travel: {
    keywords: [
      'uber', 'ola', 'rapido', 'airline', 'flight',
      'hotel', 'booking', 'makemytrip', 'goibibo',
      'cleartrip', 'irctc', 'train', 'bus', 'taxi'
    ],
    patterns: [
      /travel/i,
      /transport/i,
      /taxi/i,
      /flight/i,
      /hotel/i
    ]
  },

  entertainment: {
    keywords: [
      'netflix', 'amazon prime', 'hotstar', 'spotify',
      'youtube', 'bookmyshow', 'pvr', 'inox', 'cinema',
      'movie', 'theatre', 'game', 'entertainment'
    ],
    patterns: [
      /entertainment/i,
      /movie/i,
      /cinema/i,
      /game/i
    ]
  },

  bills: {
    keywords: [
      'electricity', 'water', 'gas', 'internet', 'broadband',
      'phone', 'mobile', 'airtel', 'jio', 'vodafone',
      'bill', 'utility', 'recharge'
    ],
    patterns: [
      /bill/i,
      /utility/i,
      /electricity/i,
      /recharge/i
    ]
  },

  groceries: {
    keywords: [
      'bigbasket', 'grofers', 'blinkit', 'dunzo', 'zepto',
      'supermarket', 'grocery', 'vegetables', 'fruits',
      'provisions', 'kirana'
    ],
    patterns: [
      /grocery/i,
      /supermarket/i,
      /mart/i
    ]
  },

  healthcare: {
    keywords: [
      'pharmacy', 'medical', 'hospital', 'clinic', 'doctor',
      'apollo', 'health', 'medicine', 'drug', 'wellness'
    ],
    patterns: [
      /health/i,
      /medical/i,
      /pharmacy/i,
      /hospital/i,
      /clinic/i
    ]
  },

  transport: {
    keywords: [
      'petrol', 'diesel', 'fuel', 'gas', 'station',
      'parking', 'toll', 'fastag'
    ],
    patterns: [
      /petrol/i,
      /fuel/i,
      /parking/i
    ]
  },

  education: {
    keywords: [
      'school', 'college', 'university', 'course', 'class',
      'tuition', 'coaching', 'udemy', 'coursera', 'book'
    ],
    patterns: [
      /education/i,
      /course/i,
      /book/i
    ]
  }
};

/**
 * Auto-categorize transaction based on title/merchant
 * @param {string} text - Transaction title or merchant name
 * @returns {string} - Category name or 'Other'
 */
exports.autoCategorizé = (text) => {
  if (!text) return 'Other';

  const normalizedText = text.toLowerCase();

  // Check each category
  for (const [category, rules] of Object.entries(categoryRules)) {
    // Check keywords
    const keywordMatch = rules.keywords.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );

    if (keywordMatch) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Check patterns
    const patternMatch = rules.patterns.some(pattern => 
      pattern.test(normalizedText)
    );

    if (patternMatch) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  return 'Other';
};

/**
 * Get category suggestions based on text
 * @param {string} text - Transaction title or merchant name
 * @returns {Array} - Array of suggested categories with confidence scores
 */
exports.getCategorySuggestions = (text) => {
  if (!text) return [];

  const normalizedText = text.toLowerCase();
  const suggestions = [];

  for (const [category, rules] of Object.entries(categoryRules)) {
    let score = 0;

    // Score based on keyword matches
    rules.keywords.forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // Score based on pattern matches
    rules.patterns.forEach(pattern => {
      if (pattern.test(normalizedText)) {
        score += 5;
      }
    });

    if (score > 0) {
      suggestions.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        confidence: Math.min(score / 20, 1), // Normalize to 0-1
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions.slice(0, 3); // Return top 3 suggestions
};

module.exports = { categoryRules, ...exports };