/**
 * Format number as Indian currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (amount === null || amount === undefined) return `${currency}0`;
  
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numAmount)) return `${currency}0`;
  
  // Format with Indian numbering system
  return `${currency}${numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format number without currency symbol
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (amount) => {
  if (amount === null || amount === undefined) return '0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '0';
  
  return numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Parse formatted currency string to number
 * @param {string} currencyString - Formatted currency string
 * @returns {number} - Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove currency symbols and commas
  const cleaned = currencyString.replace(/[₹$,]/g, '').trim();
  const number = parseFloat(cleaned);
  
  return isNaN(number) ? 0 : number;
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Abbreviate large numbers
 * @param {number} value - Value to abbreviate
 * @returns {string} - Abbreviated string (e.g., 1.5K, 2.3M)
 */
export const abbreviateNumber = (value) => {
  if (value === null || value === undefined) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  if (numValue >= 10000000) {
    return `${(numValue / 10000000).toFixed(1)}Cr`;
  } else if (numValue >= 100000) {
    return `${(numValue / 100000).toFixed(1)}L`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }
  
  return numValue.toString();
};

export default formatCurrency;