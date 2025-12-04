import React, { useState } from 'react';
import { FaMagic, FaCheckCircle } from 'react-icons/fa';
import { parseSMS, autoImportTransactions } from '../api/analyticsApi';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';

const AutoDetect = () => {
  const [smsText, setSmsText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const sampleMessages = [
    'Rs.450 debited from your account to ZOMATO on 15-Dec-23.',
    'Your UPI payment of Rs.1,200 to Amazon Pay is successful',
    'Rs.5000 credited to your account. Salary received.',
    'You have paid Rs.350 to OLA via UPI.',
    'Rs.2,500 debited for FLIPKART purchase.',
  ];

  const handleParse = async () => {
    if (!smsText.trim()) return toast.error('Enter SMS messages');

    setLoading(true);
    try {
      const messages = smsText.split('\n').filter(Boolean);
      const response = await parseSMS(messages);
      setParsedData(response.data || []);
    } catch {
      toast.error('Failed to parse SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData.length) return toast.error('No transactions to import');

    setImporting(true);
    try {
      const messages = smsText.split('\n').filter(Boolean);
      const response = await autoImportTransactions(messages);

      toast.success(`Imported ${response.count} transactions`);
      setSmsText('');
      setParsedData([]);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadSampleData = () => {
    setSmsText(sampleMessages.join('\n\n'));
    setParsedData([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4 flex justify-center">
      <div className="w-full max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          Auto Detect from SMS
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* INPUT CARD */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-3">SMS Messages</h2>

            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Paste your SMS messages here..."
              className="input-field h-56"
              disabled={loading || importing}
            />

            <div className="flex gap-3 mt-4">
              <button onClick={handleParse} className="btn btn-primary flex-1">
                {loading ? 'Parsing...' : <><FaMagic /> Parse SMS</>}
              </button>

              <button onClick={loadSampleData} className="btn btn-secondary">
                Load Sample
              </button>
            </div>
          </div>

          {/* RESULT CARD */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-3">Detected Transactions</h2>

            {parsedData.length ? (
              <>
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {parsedData.map((tx, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border">
                      <div className="flex justify-between mb-2">
                        <b className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </b>

                        <span className="text-xs bg-slate-200 px-3 py-1 rounded-full">
                          {tx.type}
                        </span>
                      </div>

                      <p className="text-sm"><b>Merchant:</b> {tx.merchant}</p>
                      <p className="text-sm"><b>Category:</b> {tx.category}</p>
                      <p className="text-sm"><b>Method:</b> {tx.paymentMethod}</p>
                    </div>
                  ))}
                </div>

                <button onClick={handleImport} className="w-full btn btn-success">
                  {importing ? 'Importing...' : <><FaCheckCircle /> Import Transactions</>}
                </button>
              </>
            ) : (
              <p className="text-center text-slate-400 py-10">
                Parsed transactions will appear here
              </p>
            )}
          </div>
        </div>

        {/* INFO CARD */}
        <div className="card p-6 mt-6 bg-blue-50 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            ℹ️ How Auto Detect Works
          </h3>

          <ul className="info-list">
            <li>Paste your SMS messages</li>
            <li>Click "Parse SMS"</li>
            <li>Review detected transactions</li>
            <li>Click Import to save</li>
            <li>Supports UPI, Card, Bank & Wallet messages</li>
          </ul>
        </div>

      </div>

      <style>{`
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(14,30,60,0.06);
          border: 1px solid rgba(99,102,241,0.06);
        }

        .input-field {
          width: 100%;
          padding: 0.7rem;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.06);
          background: #fbfdff;
        }

        .btn {
          padding: 0.6rem 0.9rem;
          border-radius: 10px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(90deg,#2563eb,#4f46e5);
          color: white;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #0f172a;
        }

        .btn-success {
          background: linear-gradient(90deg,#10b981,#059669);
          color: white;
        }

        /* ✅ UPDATED LI STYLES */
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-left: 0;
        }

        .info-list li {
          list-style: none;
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.15);
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .info-list li::before {
          content: "✓";
          color: #2563eb;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AutoDetect;
