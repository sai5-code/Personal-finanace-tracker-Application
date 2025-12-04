import React, { useState, useEffect, useCallback } from "react";
import { FaFilter, FaTrash } from "react-icons/fa";
import { getTransactions, deleteTransaction } from "../api/transactionApi";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateUtils";
import { toast } from "react-toastify";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // 🔥 FIX: useCallback to avoid eslint warning + avoid infinite loops
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const filters = filter !== "all" ? { type: filter } : {};
      const response = await getTransactions(filters);
      setTransactions(response.data || []);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // safe & clean
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted successfully");
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
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
          <h1 style={styles.title}>All Transactions</h1>

          <div style={styles.filterBox}>
            <FaFilter size={18} style={{ color: "#6b7280" }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        {/* Card */}
        <div className="card">
          {transactions.length > 0 ? (
            <div style={{ display: "grid", gap: "14px" }}>
              {transactions.map((t) => (
                <div key={t._id} style={styles.transactionRow}>
                  <div style={{ flex: 1 }}>
                    <p style={styles.txTitle}>{t.title}</p>
                    <p style={styles.txSub}>
                      {t.category} • {formatDate(t.date)}
                    </p>
                  </div>

                  <div style={styles.rightArea}>
                    <span
                      style={{
                        ...styles.amount,
                        color: t.type === "income" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>

                    <button
                      onClick={() => handleDelete(t._id)}
                      style={styles.deleteButton}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyMain}>No transactions found</p>
              <p style={styles.emptySub}>Start by adding your first transaction</p>
            </div>
          )}
        </div>
      </div>

      {/* INLINE CSS */}
      <style>{`
        .card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(76,139,245,0.10);
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
        }

        .spinner {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 4px solid rgba(99,102,241,0.2);
          border-top-color: var(--primary);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Transactions;

/* ----------------------------------
            INLINE STYLES
----------------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "linear-gradient(180deg,#f3f6ff,#ffffff)",
  },

  wrapper: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "26px",
    alignItems: "center",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--text)",
  },

  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(76,139,245,0.12)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },

  select: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "var(--text)",
    padding: "4px",
  },

  transactionRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px",
    background: "var(--soft-light)",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.04)",
    transition: "0.2s",
  },

  txTitle: {
    fontWeight: "600",
    color: "var(--text)",
    fontSize: "16px",
  },

  txSub: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },

  rightArea: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  amount: {
    fontWeight: "700",
    fontSize: "18px",
  },

  deleteButton: {
    border: "none",
    background: "rgba(255, 0, 0, 0.08)",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "0.2s",
  },

  emptyState: {
    textAlign: "center",
    padding: "50px 0",
  },

  emptyMain: {
    fontSize: "18px",
    color: "var(--text-secondary)",
  },

  emptySub: {
    marginTop: "6px",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },

  centerContainer: {
    minHeight: "60vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};
