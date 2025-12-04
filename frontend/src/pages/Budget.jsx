import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { getBudgets, createBudget, deleteBudget } from "../api/budgetApi";
import { formatCurrency } from "../utils/formatCurrency";
import { getCurrentMonthYear } from "../utils/dateUtils";
import { toast } from "react-toastify";

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
  });

  const { month, year } = getCurrentMonthYear();

  const categories = [
    "Food",
    "Shopping",
    "Travel",
    "Entertainment",
    "Bills",
    "Healthcare",
    "Education",
    "Groceries",
    "Transport",
    "Other",
  ];

  // Fetch budgets safely
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBudgets(month, year);
      setBudgets(response.data || []);
    } catch (error) {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await createBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        month,
        year,
      });

      toast.success("Budget created successfully!");
      setShowModal(false);
      setFormData({ category: "Food", amount: "" });
      fetchBudgets();
    } catch (error) {
      toast.error(error.message || "Failed to create budget");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      await deleteBudget(id);
      toast.success("Budget deleted");
      fetchBudgets();
    } catch (error) {
      toast.error("Failed to delete budget");
    }
  };

  const getBarColor = (percentage) => {
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 80) return "#f59e0b";
    return "#10b981";
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>

        {/* Header */}
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Budget Planner</h1>

          <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <FaPlus /> Add Budget
          </button>
        </div>

        {/* Budgets */}
        {budgets.length > 0 ? (
          <div style={styles.grid}>
            {budgets.map((b) => {
              const percentage = (b.spent / Math.max(b.amount, 1)) * 100;
              const remaining = b.amount - b.spent;

              return (
                <div key={b._id} className="card" style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{b.category}</h3>

                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDelete(b._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={styles.progressBg}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min(percentage, 100)}%`,
                          background: getBarColor(percentage),
                        }}
                      ></div>
                    </div>
                  </div>

                  <div style={styles.budgetInfo}>
                    <div style={styles.row}>
                      <span style={styles.label}>Spent:</span>
                      <span style={styles.value}>{formatCurrency(b.spent)}</span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.label}>Budget:</span>
                      <span style={styles.value}>{formatCurrency(b.amount)}</span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.label}>Remaining:</span>
                      <span
                        style={{
                          ...styles.value,
                          color: remaining < 0 ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {formatCurrency(Math.abs(remaining))}
                        {remaining < 0 && " over"}
                      </span>
                    </div>

                    <div style={styles.usageRow}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color:
                            percentage >= 100
                              ? "#dc2626"
                              : percentage >= 80
                              ? "#d97706"
                              : "#059669",
                        }}
                      >
                        {percentage.toFixed(1)}% used
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <p style={styles.emptyTitle}>No budgets created yet</p>
            <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
              Create Your First Budget
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={styles.overlay} onClick={() => setShowModal(false)}>
            <div
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={styles.modalTitle}>Create Budget</h2>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                {/* Category */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    style={styles.inputField}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Budget Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    style={styles.inputField}
                  />
                </div>

                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnPrimary}>
                    Create Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Inline Styles */}
      <style>{`
        .card {
          background: white;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
          border: 1px solid rgba(76,139,245,0.1);
        }
        .spinner {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 4px solid rgba(99,102,241,0.2);
          border-top-color: var(--primary);
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Budget;

/* ---------------------------------------------
                STYLES
--------------------------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "linear-gradient(180deg,#f3f6ff,#ffffff)",
  },
  wrapper: { maxWidth: "1200px", margin: "0 auto" },
  centerContainer: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "26px",
    alignItems: "center",
  },
  title: { fontSize: "32px", fontWeight: "700", color: "var(--text)" },

  /* Buttons */
  btnPrimary: {
    background: "linear-gradient(90deg,#2563eb,#4f46e5)",
    color: "white",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnSecondary: {
    flex: 1,
    background: "#f1f5f9",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnRow: { display: "flex", gap: "10px" },

  /* Grid */
  grid: {
    display: "grid",
    gap: "18px",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  },

  /* Budget Cards */
  card: {},
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    alignItems: "center",
  },
  cardTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text)" },
  deleteButton: {
    background: "rgba(255,0,0,0.08)",
    padding: "8px 10px",
    borderRadius: "10px",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
  },

  /* Progress */
  progressBg: {
    width: "100%",
    height: "12px",
    background: "#f1f5f9",
    borderRadius: "12px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "12px",
    transition: "0.3s",
  },

  /* Info Rows */
  budgetInfo: { display: "grid", gap: "8px", fontSize: "14px" },
  row: { display: "flex", justifyContent: "space-between" },
  label: { color: "var(--text-secondary)" },
  value: { fontWeight: "600", color: "var(--text)" },
  usageRow: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "10px",
    marginTop: "6px",
  },

  /* Empty State */
  emptyTitle: { color: "var(--text-secondary)", fontSize: "18px", marginBottom: "12px" },

  /* Modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },
  modalTitle: { fontSize: "24px", fontWeight: "700", color: "var(--text)", marginBottom: "14px" },
  formGroup: { display: "grid", gap: "6px" },
  inputField: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    width: "100%",
  },
};
