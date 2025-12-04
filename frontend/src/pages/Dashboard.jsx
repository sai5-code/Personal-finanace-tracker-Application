import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaPlus,
} from "react-icons/fa";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getDashboardData } from "../api/analyticsApi";
import { chartColors } from "../utils/categoryColors";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateUtils";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        No data available
      </div>
    );
  }

  const { summary, categoryAnalysis, weeklySummary, topExpenses, insights } = data;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "40px 20px",
        background: "linear-gradient(180deg,#f3f6ff,#ffffff)",
      }}
    >
      <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "var(--text)",
            }}
          >
            Dashboard
          </h1>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link className="btn-danger" to="/add-expense">
              <FaPlus /> Add Expense
            </Link>
            <Link className="btn-success" to="/add-income">
              <FaPlus /> Add Income
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          {/* Desktop 3 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: "20px",
            }}
          >
            <SummaryCard
              title="Total Income"
              amount={summary.income}
              color="#10b981"
              icon={FaArrowUp}
            />

            <SummaryCard
              title="Total Expenses"
              amount={summary.expenses}
              color="#ef4444"
              icon={FaArrowDown}
            />

            <SummaryCard
              title="Balance"
              amount={summary.balance}
              color="#2563eb"
              icon={FaWallet}
            />
          </div>
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div
            style={{
              background: "rgba(76,139,245,0.08)",
              borderLeft: "6px solid var(--primary)",
              padding: "18px",
              borderRadius: "10px",
              marginBottom: "30px",
            }}
          >
            <h3
              style={{
                fontWeight: "600",
                marginBottom: "10px",
                color: "var(--primary-dark)",
              }}
            >
              💡 Insights
            </h3>
            {insights.map((i, idx) => (
              <p
                key={idx}
                style={{ color: "var(--primary-dark)", marginBottom: "4px" }}
              >
                • {i.message}
              </p>
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "25px",
          }}
        >
          <div className="card">
            <h3 className="card-title">Spending by Category</h3>
            {categoryAnalysis?.length > 0 ? (
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={categoryAnalysis}
                    dataKey="total"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {categoryAnalysis.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={chartColors[i % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No expense data available</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Weekly Spending</h3>
            {weeklySummary?.dailyData ? (
              <ResponsiveContainer width="100%" height={310}>
                <LineChart data={weeklySummary.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Line
                    type="basis"
                    strokeWidth={3}
                    dataKey="total"
                    stroke="var(--primary)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No weekly data available</p>
            )}
          </div>
        </div>

        {/* Top Expenses */}
        {topExpenses && topExpenses.length > 0 && (
          <div className="card" style={{ marginTop: "30px" }}>
            <h3 className="card-title">Top Expenses (Last 30 Days)</h3>

            <div style={{ display: "grid", gap: "12px" }}>
              {topExpenses.map((exp) => (
                <div
                  key={exp._id}
                  style={{
                    background: "var(--soft-light)",
                    padding: "14px",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "0.3s ease",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div>
                    <p className="expense-title">{exp.title}</p>
                    <p className="expense-sub">
                      {exp.category} • {formatDate(exp.date)}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#e11d48",
                    }}
                  >
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline Styling */}
      <style>{`
        .card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.07);
          border: 1px solid rgba(76,139,245,0.1);
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 14px;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .expense-title {
          font-weight: 600;
          color: var(--text);
        }

        .expense-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .btn-danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  transition: transform 0.08s ease, box-shadow 0.12s ease;
}

.btn-danger:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
}

.btn-danger:active {
  transform: translateY(1px);
}

.btn-success {
  background: linear-gradient(90deg, #10b981, #059669);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: transform 0.08s ease, box-shadow 0.12s ease;
}

.btn-success:hover {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

.btn-success:active {
  transform: translateY(1px);
}

      `}</style>
    </div>
  );
};

/* Summary Card Component */
const SummaryCard = ({ title, amount, icon: Icon, color }) => {
  return (
    <div className="card" style={{ textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <h3 style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
          {title}
        </h3>

        <div
          style={{
            padding: "12px",
            borderRadius: "12px",
            background: `${color}15`,
            color: color,
            fontSize: "20px",
          }}
        >
          <Icon />
        </div>
      </div>

      <p
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "var(--text)",
        }}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
};

export default Dashboard;
