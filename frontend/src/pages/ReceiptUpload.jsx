import React, { useState, useEffect, useCallback } from "react";
import { FaUpload, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import { uploadReceipt, getReceipts, createTransactionFromReceipt } from "../api/receiptApi";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateUtils";
import { toast } from "react-toastify";

const ReceiptUpload = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReceipts();
      setReceipts(response.data || []);
    } catch (error) {
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      await uploadReceipt(file);
      toast.success("Receipt uploaded! Processing...");
      setTimeout(fetchReceipts, 1500);
    } catch (error) {
      toast.error(error.message || "Failed to upload receipt");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateTransaction = async (receiptId) => {
    try {
      await createTransactionFromReceipt(receiptId);
      toast.success("Transaction created!");
      fetchReceipts();
    } catch (error) {
      toast.error(error.message || "Failed to create transaction");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle style={{ color: "#22c55e" }} />;
      case "failed":
        return <FaTimesCircle style={{ color: "#ef4444" }} />;
      default:
        return <FaClock style={{ color: "#f59e0b" }} />;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>

        <h1 style={styles.title}>Receipt Upload & OCR</h1>

        {/* Upload Card */}
        <div className="card" style={styles.card}>
          <h2 style={styles.sectionTitle}>Upload Receipt</h2>
          <p style={styles.subtitle}>
            Upload a photo of your receipt. The system will automatically extract details.
          </p>

          <label
            style={{
              ...styles.uploadBox,
              ...(uploading ? styles.uploadDisabled : styles.uploadActive),
            }}
          >
            <div style={{ textAlign: "center" }}>
              {uploading ? (
                <>
                  <div className="spinner" style={styles.spinner}></div>
                  <p style={styles.uploadingText}>Uploading...</p>
                </>
              ) : (
                <>
                  <FaUpload style={styles.uploadIcon} />
                  <p style={styles.uploadText}>
                    <strong>Click to upload</strong> or drag and drop
                  </p>
                  <p style={styles.uploadHint}>PNG, JPG, JPEG (Max 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              hidden
              accept="image/*"
              disabled={uploading}
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Recent Receipts */}
        <div className="card" style={styles.card}>
          <h2 style={styles.sectionTitle}>Recent Receipts</h2>

          {loading ? (
            <div className="spinner" style={{ margin: "20px auto" }}></div>
          ) : receipts.length === 0 ? (
            <p style={styles.emptyText}>No receipts uploaded yet.</p>
          ) : (
            <div style={styles.receiptList}>
              {receipts.map((r) => (
                <div key={r._id} style={styles.receiptItem}>
                  <div style={styles.receiptRow}>
                    <div>
                      <div style={styles.statusRow}>
                        {getStatusIcon(r.processingStatus)}
                        <span style={styles.statusText}>
                          {r.processingStatus === "completed"
                            ? "Processed"
                            : r.processingStatus === "failed"
                            ? "Failed"
                            : "Processing..."}
                        </span>
                      </div>

                      {r.processingStatus === "completed" && r.extractedData && (
                        <div style={styles.receiptDetail}>
                          <p>
                            <span style={styles.label}>Merchant: </span>
                            <span style={styles.value}>
                              {r.extractedData.merchant || "Unknown"}
                            </span>
                          </p>
                          <p>
                            <span style={styles.label}>Amount: </span>
                            <span style={styles.value}>
                              {formatCurrency(r.extractedData.amount || 0)}
                            </span>
                          </p>
                          <p>
                            <span style={styles.label}>Date: </span>
                            <span style={styles.value}>
                              {r.extractedData.date ? formatDate(r.extractedData.date) : "N/A"}
                            </span>
                          </p>
                          <p>
                            <span style={styles.label}>Category: </span>
                            <span style={styles.value}>
                              {r.extractedData.category || "Other"}
                            </span>
                          </p>
                        </div>
                      )}

                      {r.processingStatus === "failed" && (
                        <p style={styles.failedText}>
                          {r.processingError || "Failed to process receipt"}
                        </p>
                      )}
                    </div>

                    {r.processingStatus === "completed" && !r.transactionId && (
                      <button
                        style={styles.btnPrimary}
                        onClick={() => handleCreateTransaction(r._id)}
                      >
                        Create Transaction
                      </button>
                    )}

                    {r.transactionId && (
                      <span style={styles.transactionCreated}>✓ Transaction Created</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
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
            border-top-color: #4f46e5;
            animation: spin 1s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
};

export default ReceiptUpload;


const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "linear-gradient(180deg,#eef3ff,#ffffff)",
  },
  wrapper: { maxWidth: "1200px", margin: "0 auto" },

  title: { fontSize: "32px", fontWeight: "700", marginBottom: "20px", color: "#111827" },
  sectionTitle: { fontSize: "22px", fontWeight: "700", marginBottom: "8px", color: "#111827" },
  subtitle: { color: "#475569", marginBottom: "20px" },

  /* Updated Upload Box — NO MORE GHOST BOXES */
  uploadBox: {
    width: "100%",
    padding: "35px",
    borderRadius: "14px",
    background: "#f8faff",
    cursor: "pointer",
    textAlign: "center",
    transition: "0.2s",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadActive: {
    background: "#f0f7ff",
  },
  uploadDisabled: {
    background: "#f1f5f9",
    opacity: 0.6,
    cursor: "not-allowed",
  },

  uploadIcon: { color: "#2563eb", fontSize: "42px", marginBottom: "8px" },
  uploadingText: { color: "#475569", fontWeight: "500" },
  uploadText: { color: "#475569", marginBottom: "4px" },
  uploadHint: { color: "#94a3b8", fontSize: "12px" },

  /* Receipts */
  receiptList: { display: "grid", gap: "16px" },
  receiptItem: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
  },

  receiptRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  statusRow: { display: "flex", alignItems: "center", gap: "6px" },
  statusText: { fontWeight: "600", color: "#334155" },

  receiptDetail: { marginTop: "8px", fontSize: "14px" },
  label: { color: "#64748b" },
  value: { fontWeight: "600", color: "#1e293b" },

  failedText: { color: "#dc2626", fontSize: "14px" },

  /* Buttons */
  btnPrimary: {
    background: "linear-gradient(90deg,#2563eb,#4f46e5)",
    color: "white",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    height: "fit-content",
  },
  transactionCreated: { color: "#16a34a", fontWeight: "600" },

  emptyText: { textAlign: "center", color: "#94a3b8", padding: "16px" },

  spinner: { margin: "10px auto" },
};
