import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction } from '../api/transactionApi';
import { getDateInputValue } from '../utils/dateUtils';
import { toast } from 'react-toastify';

const AddIncome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Salary',
    description: '',
    date: getDateInputValue(),
  });

  const categories = [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Gift',
    'Refund',
    'Other',
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        type: 'income',
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
      };

      await createTransaction(transactionData);
      toast.success('Income added successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Add Income</h1>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Monthly Salary"
                className="input-field"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="input-field"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="label">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes about this income..."
                className="input-field h-28"
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-success"
              >
                {loading ? 'Adding...' : 'Add Income'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* Reuse similar styling as AddExpense for consistency */
        .card {
          background: white;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(14, 30, 60, 0.06);
          border: 1px solid rgba(99,102,241,0.06);
        }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-weight: 600; color: #334155; font-size: 0.95rem; }
        .input-field {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.06);
          outline: none;
          font-size: 0.95rem;
          color: #0f172a;
          background: #fbfdff;
        }
        .input-field:focus {
          box-shadow: 0 6px 18px rgba(79,70,229,0.12);
          border-color: rgba(99,102,241,0.7);
        }
        .btn {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(2,6,23,0.06);
        }
        .btn-success {
          background: linear-gradient(90deg,#10b981,#059669);
          color: white;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #0f172a;
          border: 1px solid rgba(15,23,42,0.04);
        }
      `}</style>
    </div>
  );
};

export default AddIncome;
