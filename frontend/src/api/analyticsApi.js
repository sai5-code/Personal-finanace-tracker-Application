import api from './authApi';

/**
 * Get financial summary
 */
export const getFinancialSummary = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch summary' };
  }
};

/**
 * Get category analysis
 */
export const getCategoryAnalysis = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/categories?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch category analysis' };
  }
};

/**
 * Get monthly trend
 */
export const getMonthlyTrend = async (year) => {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    
    const response = await api.get(`/analytics/monthly-trend?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch monthly trend' };
  }
};

/**
 * Get weekly summary
 */
export const getWeeklySummary = async () => {
  try {
    const response = await api.get('/analytics/weekly-summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch weekly summary' };
  }
};

/**
 * Get top expenses
 */
export const getTopExpenses = async (limit = 5) => {
  try {
    const response = await api.get(`/analytics/top-expenses?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch top expenses' };
  }
};

/**
 * Get spending insights
 */
export const getInsights = async () => {
  try {
    const response = await api.get('/analytics/insights');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch insights' };
  }
};

/**
 * Get complete dashboard data
 */
export const getDashboardData = async () => {
  try {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard data' };
  }
};

/**
 * Parse SMS messages
 */
export const parseSMS = async (messages) => {
  try {
    const response = await api.post('/analytics/parse-sms', { messages });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to parse SMS' };
  }
};

/**
 * Auto-import transactions from SMS
 */
export const autoImportTransactions = async (messages) => {
  try {
    const response = await api.post('/analytics/auto-import', { messages });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to auto-import transactions' };
  }
};