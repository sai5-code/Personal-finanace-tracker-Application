import api from './authApi';

/**
 * Upload receipt image
 */
export const uploadReceipt = async (file) => {
  try {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post('/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload receipt' };
  }
};

/**
 * Get all receipts
 */
export const getReceipts = async () => {
  try {
    const response = await api.get('/receipts');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch receipts' };
  }
};

/**
 * Get single receipt
 */
export const getReceipt = async (id) => {
  try {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch receipt' };
  }
};

/**
 * Update receipt (manual corrections)
 */
export const updateReceipt = async (id, receiptData) => {
  try {
    const response = await api.put(`/receipts/${id}`, receiptData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update receipt' };
  }
};

/**
 * Create transaction from receipt
 */
export const createTransactionFromReceipt = async (id) => {
  try {
    const response = await api.post(`/receipts/${id}/create-transaction`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create transaction' };
  }
};

/**
 * Delete receipt
 */
export const deleteReceipt = async (id) => {
  try {
    const response = await api.delete(`/receipts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete receipt' };
  }
};