/**
 * Category color mappings
 */
export const categoryColors = {
  Food: '#ef4444',
  Shopping: '#f59e0b',
  Travel: '#3b82f6',
  Entertainment: '#8b5cf6',
  Bills: '#ef4444',
  Healthcare: '#10b981',
  Education: '#6366f1',
  Groceries: '#84cc16',
  Transport: '#06b6d4',
  Salary: '#10b981',
  Investment: '#3b82f6',
  Other: '#6b7280',
};

/**
 * Get color for category
 * @param {string} category - Category name
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (category) => {
  return categoryColors[category] || categoryColors.Other;
};

/**
 * Get random color
 * @returns {string} - Hex color code
 */
export const getRandomColor = () => {
  const colors = Object.values(categoryColors);
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Chart colors array (for Recharts)
 */
export const chartColors = [
  '#4c8bf5', // Primary blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Deep orange
  '#6366f1', // Indigo
];

/**
 * Status colors
 */
export const statusColors = {
  good: '#10b981',
  warning: '#f59e0b',
  exceeded: '#ef4444',
  critical: '#dc2626',
};

/**
 * Get status color
 * @param {string} status - Status name
 * @returns {string} - Hex color code
 */
export const getStatusColor = (status) => {
  return statusColors[status] || statusColors.good;
};

export default categoryColors;