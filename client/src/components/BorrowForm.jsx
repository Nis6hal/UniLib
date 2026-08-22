import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCw,
  Search,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function BorrowForm({ currentUser }) {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('issue');
  const [search, setSearch] = useState('');
  const [issueForm, setIssueForm] = useState({ book_id: '', user_id: '', days: 14 });
  const [returnId, setReturnId] = useState('');
  const [renewId, setRenewId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';

  async function load() {
    try {
      setLoading(true);
      const params = { active: 'true' };
      if (isStudent && currentUser?.id) {
        params.user_id = currentUser.id;
      }
      const data = await api.getBorrows(params);
      setBorrows(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load active loan records', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentUser]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.borrowBook(issueForm);
      setIssueForm({ book_id: '', user_id: '', days: 14 });
      addToast('Book issued successfully', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async (idToReturn) => {
    const targetId = idToReturn || parseInt(returnId);
    if (!targetId) return;
    setIsProcessing(true);
    try {
      await api.returnBook(targetId);
      setReturnId('');
      addToast(`Book loan #${targetId} returned successfully`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async (idToRenew) => {
    const targetId = idToRenew || parseInt(renewId);
    if (!targetId) return;
    setIsProcessing(true);
    try {
      await api.renewBorrow(targetId);
      setRenewId('');
      addToast(`Loan #${targetId} renewed for +14 days`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const isOverdue = (dueAtStr) => {
    if (!dueAtStr) return false;
    return new Date(dueAtStr) < new Date();
  };

  const filteredBorrows = borrows.filter((b) => {
    const query = search.toLowerCase();
    return (
      b.user_name?.toLowerCase().includes(query) ||
      b.title?.toLowerCase().includes(query) ||
      String(b.id).includes(query)
    );
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">
            {isStudent ? 'My Active Loans & Renewals' : 'Circulation Desk'}
          </h1>
          <p className="subtitle">
            {isStudent
              ? 'View your borrowed library books, manage return deadlines, and extend loans'
              : 'Issue new book loans, process check-ins, and extend renewal periods'}
          </p>
        </div>
      </div>

      {/* Circulation Tabs for Librarians/Admins */}
      {!isStudent && (
        <>
          <div className="tab-bar">
            <button
              className={activeTab === 'issue' ? 'active' : ''}
              onClick={() => setActiveTab('issue')}
            >
              <ArrowDownLeft size={16} /> Issue Book
            </button>
            <button
              className={activeTab === 'return' ? 'active' : ''}
              onClick={() => setActiveTab('return')}
            >
              <ArrowUpRight size={16} /> Quick Return
            </button>
            <button
              className={activeTab === 'renew' ? 'active' : ''}
              onClick={() => setActiveTab('renew')}
            >
              <RotateCw size={16} /> Quick Renew
            </button>
          </div>

          {activeTab === 'issue' && (
            <form className="form-card animate-in" onSubmit={handleIssue}>
              <div style={{ marginBottom: 16 }}>
                <h3>Issue Book to Member</h3>
                <p className="subtitle">Check out a physical copy by specifying Book ID and Member ID</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Book ID</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 1"
                    value={issueForm.book_id}
                    onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Member ID</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 2"
                    value={issueForm.user_id}
                    onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Loan Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Default: 14 days"
                    value={issueForm.days}
                    onChange={(e) => setIssueForm({ ...issueForm, days: parseInt(e.target.value) || 14 })}
                  />
                </div>
              </div>

              <button type="submit" disabled={isProcessing}>
                <ArrowDownLeft size={16} />
                {isProcessing ? 'Processing...' : 'Confirm Loan Issue'}
              </button>
            </form>
          )}

          {activeTab === 'return' && (
            <div className="form-card animate-in">
              <div style={{ marginBottom: 16 }}>
                <h3>Return Book</h3>
                <p className="subtitle">Check in a borrowed book by entering Borrow Record ID</p>
              </div>

              <div className="form-grid" style={{ maxWidth: 400 }}>
                <div className="form-group">
                  <label>Borrow Record ID</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 5"
                    value={returnId}
                    onChange={(e) => setReturnId(e.target.value)}
                  />
                </div>
              </div>

              <button className="success" onClick={() => handleReturn()} disabled={isProcessing || !returnId}>
                <ArrowUpRight size={16} />
                {isProcessing ? 'Processing...' : 'Process Return'}
              </button>
            </div>
          )}

          {activeTab === 'renew' && (
            <div className="form-card animate-in">
              <div style={{ marginBottom: 16 }}>
                <h3>Renew Book Loan</h3>
                <p className="subtitle">Extend due date for a loan record by 14 days</p>
              </div>

              <div className="form-grid" style={{ maxWidth: 400 }}>
                <div className="form-group">
                  <label>Borrow Record ID</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 5"
                    value={renewId}
                    onChange={(e) => setRenewId(e.target.value)}
                  />
                </div>
              </div>

              <button className="secondary" onClick={() => handleRenew()} disabled={isProcessing || !renewId}>
                <RotateCw size={16} />
                {isProcessing ? 'Processing...' : 'Extend Loan'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Active Loans Table */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <h2>{isStudent ? 'My Active Borrow Records' : 'All Active Loans'}</h2>
            <p className="subtitle">
              {isStudent
                ? 'Your currently checked out books with instant 1-click renewal'
                : 'Real-time master list of all checked-out books across campus'}
            </p>
          </div>

          {!isStudent && (
            <div className="search-box-wrapper" style={{ minWidth: 220, maxWidth: 300 }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter active loans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', fontSize: '0.82rem' }}
              />
            </div>
          )}
        </div>

        {loading && <Spinner message="Loading loan records..." />}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && filteredBorrows.length === 0 && (
          <div className="empty-state">
            <Clock className="empty-icon" />
            <p>{isStudent ? 'You have no books currently checked out.' : 'No active loans matching criteria'}</p>
          </div>
        )}

        {!loading && !error && filteredBorrows.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record</th>
                  {!isStudent && <th>Member</th>}
                  <th>Book Title</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Renewals</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrows.map((b) => {
                  const overdue = isOverdue(b.due_at);
                  return (
                    <tr key={b.id}>
                      <td className="td-id">#{b.id}</td>
                      {!isStudent && <td><strong>{b.user_name}</strong></td>}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.title}</div>
                      </td>
                      <td className="td-id">{b.borrowed_at?.slice(0, 10)}</td>
                      <td>
                        <span className={`badge ${overdue ? 'badge-danger' : 'badge-warning'}`}>
                          {overdue && <AlertCircle size={12} />}
                          {b.due_at?.slice(0, 10)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">{b.renewals || 0} / 2</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleRenew(b.id)}
                            title="Renew Loan (+14 Days)"
                          >
                            <RotateCw size={13} /> Renew
                          </button>
                          <button
                            className="success"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleReturn(b.id)}
                            title="Return Book"
                          >
                            <ArrowUpRight size={13} /> Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}