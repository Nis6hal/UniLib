import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  CreditCard
} from 'lucide-react';

export default function FineList({ currentUser }) {
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';

  async function load() {
    try {
      setLoading(true);
      const params = {};
      if (isStudent && currentUser?.id) {
        params.user_id = currentUser.id;
      }
      const data = await api.getFines(params);
      setFines(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load fines list', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentUser]);

  const handlePay = async (id, amount) => {
    setIsProcessing(true);
    try {
      await api.payFine(id);
      addToast(`Fine #${id} ($${Number(amount).toFixed(2)}) settled successfully`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalUnpaid = fines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalPaid = fines
    .filter((f) => f.paid)
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const filteredFines = fines.filter((f) => {
    if (filter === 'unpaid') return !f.paid;
    if (filter === 'paid') return f.paid;
    return true;
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">
            {isStudent ? 'My Fines & Penalties' : 'Campus Fines & Penalties'}
          </h1>
          <p className="subtitle">
            {isStudent
              ? 'View overdue penalties assessed on your account and settle balances'
              : 'Track overdue loan penalties across campus and process fine settlements'}
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="stat-card rose">
          <div className="stat-header">
            <h3>{isStudent ? 'My Unpaid Balance' : 'Total Outstanding'}</h3>
            <div className="stat-icon-wrapper">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="stat-value">${totalUnpaid.toFixed(2)}</p>
          <div className="stat-footer-badge" style={{ color: '#fb7185' }}>
            {totalUnpaid > 0 ? 'Pending payment' : 'No outstanding fines'}
          </div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-header">
            <h3>{isStudent ? 'My Settled Fines' : 'Total Collected'}</h3>
            <div className="stat-icon-wrapper">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="stat-value">${totalPaid.toFixed(2)}</p>
          <div className="stat-footer-badge" style={{ color: '#34d399' }}>
            Paid penalties
          </div>
        </div>
      </div>

      {/* Fines Table Section */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <h2>{isStudent ? 'My Fine Records' : 'All Fine Records'}</h2>

          {/* Filter Tabs */}
          <div className="view-toggle">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({fines.length})
            </button>
            <button
              type="button"
              className={filter === 'unpaid' ? 'active' : ''}
              onClick={() => setFilter('unpaid')}
            >
              Unpaid ({fines.filter((f) => !f.paid).length})
            </button>
            <button
              type="button"
              className={filter === 'paid' ? 'active' : ''}
              onClick={() => setFilter('paid')}
            >
              Paid ({fines.filter((f) => f.paid).length})
            </button>
          </div>
        </div>

        {loading && <Spinner message="Loading fines records..." />}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && filteredFines.length === 0 && (
          <div className="empty-state">
            <Receipt className="empty-icon" />
            <p>{isStudent ? 'You have no fine records on your account.' : 'No fine records found'}</p>
          </div>
        )}

        {!loading && !error && filteredFines.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fine ID</th>
                  {!isStudent && <th>Member</th>}
                  <th>Book Title</th>
                  <th>Penalty Amount</th>
                  <th>Status</th>
                  <th>Assessed On</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFines.map((f) => (
                  <tr key={f.id}>
                    <td className="td-id">#{f.id}</td>
                    {!isStudent && <td><strong>{f.user_name}</strong></td>}
                    <td>{f.title}</td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: f.paid ? 'var(--text-secondary)' : '#fb7185' }}>
                        ${Number(f.amount || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${f.paid ? 'badge-success' : 'badge-danger'}`}>
                        {f.paid ? (
                          <>
                            <CheckCircle2 size={12} /> Paid
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} /> Unpaid
                          </>
                        )}
                      </span>
                    </td>
                    <td className="td-id">{f.created_at?.slice(0, 10)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!f.paid && (
                        <button
                          className="success"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => handlePay(f.id, f.amount)}
                          disabled={isProcessing}
                        >
                          <CreditCard size={13} /> Settle Fine
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}