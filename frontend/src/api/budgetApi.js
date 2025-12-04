import api from './authApi';

/**
 * Get all budgets
 */
export const getBudgets = async (month, year) => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await api.get(`/budgets?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch budgets' };
  }
};

/**
 * Get single budget
 */
export const getBudget = async (id) => {
  try {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch budget' };
  }
};

/**
 * Create new budget
 */
export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create budget' };
  }
};

/**
 * Update budget
 */
export const updateBudget = async (id, budgetData) => {
  try {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update budget' };
  }
};

/**
 * Delete budget
 */
export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete budget' };
  }
};

/**
 * Get budget status summary
 */
export const getBudgetStatus = async (month, year) => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await api.get(`/budgets/status/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch budget status' };
  }
};

/**
 * Refresh budget calculations
 */
export const refreshBudgets = async (month, year) => {
  try {
    const response = await api.post('/budgets/refresh', { month, year });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to refresh budgets' };
  }
};

/**
 * Get budget suggestions
 */
export const getBudgetSuggestions = async () => {
  try {
    const response = await api.get('/budgets/suggestions');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch suggestions' };
  }
};