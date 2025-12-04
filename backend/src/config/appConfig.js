module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_tracker',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Rate Limiting
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // File Upload Configuration
  FILE_UPLOAD: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  },
  
  // Default Categories
  DEFAULT_CATEGORIES: [
    'Food',
    'Shopping',
    'Travel',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Education',
    'Groceries',
    'Transport',
    'Other'
  ],
  
  // Transaction Types
  TRANSACTION_TYPES: ['income', 'expense'],
  
  // Budget Alert Thresholds
  BUDGET_THRESHOLDS: {
    warning: 0.8, // 80%
    critical: 1.0, // 100%
  },
};