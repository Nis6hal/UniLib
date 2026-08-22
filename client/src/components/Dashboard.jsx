import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  DollarSign,
  CalendarClock,
  Lock,
  Layers,
  TrendingUp,
  Sparkles,
  RotateCw,
  Clock,
  CheckCircle2,
  BookMarked
} from 'lucide-react';

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="chart-container">
      {data.map((d, index) => {
        const percentage = Math.round((d.value / max) * 100);
        const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
        return (
          <div key={d.label} className="chart-row">
            <div className={`chart-rank ${rankClass}`}>
              {index + 1}
            </div>
            <span className="chart-label" title={d.label}>
              {d.label}
            </span>
            <div className="chart-bar">
              <div
                className="chart-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="chart-value">
              {d.value} {d.value === 1 ? 'loan' : 'loans'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';

  async function load() {
    try {
      setLoading(true);
      const data = await api.getStats(isStudent ? currentUser?.id : null);
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentUser]);

  const handleRenewMyLoan = async (id) => {
    try {
      await api.renewBorrow(id);
      addToast('Loan renewed for +14 days!', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  if (loading) return <Spinner message="Loading your dashboard..." />;
  if (error) return <p className="error">Error loading metrics: {error}</p>;
  if (!stats) return null;

  const topBooks = stats.top_books || [];
  const myLoans = stats.my_loans || [];

  return (
    <div className="animate-in">
      {/* Header Banner */}
      <div className="section-header">
        <div>
          <h1 className="page-title">
            {isStudent ? `Welcome, ${currentUser?.name}` : 'Executive Dashboard'}
          </h1>
          <p className="subtitle">
            {isStudent
              ? 'Your personal university circulation status, active loans, and account summary'
              : 'Real-time overview of library catalog, circulation, and member activities'}
          </p>
        </div>
      </div>

      {/* Student Personal Metrics */}
      {isStudent ? (
        <>
          <div className="stats-grid">
            <div className="stat-card indigo">
              <div className="stat-header">
                <h3>My Active Loans</h3>
                <div className="stat-icon-wrapper">
                  <Repeat size={20} />
                </div>
              </div>
              <p className="stat-value">
                {stats.active_borrows} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats.borrow_limit} allowed</span>
              </p>
              <div className="stat-footer-badge">
                <Layers size={12} /> Personal Borrow Quota
              </div>
            </div>

            <div className="stat-card rose">
              <div className="stat-header">
                <h3>My Overdue Loans</h3>
                <div className="stat-icon-wrapper">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="stat-value">{stats.overdue}</p>
              <div className="stat-footer-badge" style={{ color: stats.overdue > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                {stats.overdue > 0 ? 'Action required' : 'All loans on time'}
              </div>
            </div>

            <div className="stat-card amber">
              <div className="stat-header">
                <h3>My Unpaid Fines</h3>
                <div className="stat-icon-wrapper">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="stat-value">${Number(stats.unpaid_fines || 0).toFixed(2)}</p>
              <div className="stat-footer-badge">
                {stats.unpaid_fines > 0 ? 'Outstanding balance' : 'Zero balance'}
              </div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-header">
                <h3>Ready For Pickup</h3>
                <div className="stat-icon-wrapper">
                  <Lock size={20} />
                </div>
              </div>
              <p className="stat-value">{stats.ready_holds}</p>
              <div className="stat-footer-badge">
                {stats.ready_holds > 0 ? 'Held on shelf' : 'No pending pickups'}
              </div>
            </div>
          </div>

          {/* Student's Active Loans Card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <div>
                <h2>My Borrowed Books</h2>
                <p className="subtitle">Books currently checked out under your student ID</p>
              </div>
            </div>

            {myLoans.length === 0 ? (
              <div className="empty-state">
                <BookOpen className="empty-icon" />
                <p>You currently have no active book loans. Explore the catalog to borrow books!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title & Author</th>
                      <th>Borrowed On</th>
                      <th>Due Date</th>
                      <th>Renewals</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLoans.map((l) => {
                      const isOverdue = new Date(l.due_at) < new Date();
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="td-title">
                              <span
                                className="book-spine-dot"
                                style={{ backgroundColor: l.cover_color || 'var(--primary)' }}
                              />
                              <div>
                                <div>{l.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {l.author}</div>
                              </div>
                            </div>
                          </td>
                          <td className="td-id">{l.borrowed_at?.slice(0, 10)}</td>
                          <td>
                            <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                              {isOverdue && <AlertTriangle size={12} />}
                              Due: {l.due_at?.slice(0, 10)}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-info">{l.renewals || 0} / 2</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="secondary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              onClick={() => handleRenewMyLoan(l.id)}
                            >
                              <RotateCw size={13} /> Renew (+14 Days)
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Administrator / Librarian Campus-Wide Metrics */
        <div className="stats-grid">
          <div className="stat-card indigo">
            <div className="stat-header">
              <h3>Total Books</h3>
              <div className="stat-icon-wrapper">
                <BookOpen size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.total_books}</p>
            <div className="stat-footer-badge">
              <Layers size={12} /> Catalog items
            </div>
          </div>

          <div className="stat-card emerald">
            <div className="stat-header">
              <h3>Total Members</h3>
              <div className="stat-icon-wrapper">
                <Users size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.total_users}</p>
            <div className="stat-footer-badge">
              <Sparkles size={12} /> Registered accounts
            </div>
          </div>

          <div className="stat-card sky">
            <div className="stat-header">
              <h3>Active Borrows</h3>
              <div className="stat-icon-wrapper">
                <Repeat size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.active_borrows}</p>
            <div className="stat-footer-badge">
              <TrendingUp size={12} /> In circulation
            </div>
          </div>

          <div className="stat-card rose">
            <div className="stat-header">
              <h3>Overdue Loans</h3>
              <div className="stat-icon-wrapper">
                <AlertTriangle size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.overdue}</p>
            <div className="stat-footer-badge" style={{ color: '#fb7185' }}>
              Requires follow-up
            </div>
          </div>

          <div className="stat-card amber">
            <div className="stat-header">
              <h3>Unpaid Fines</h3>
              <div className="stat-icon-wrapper">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="stat-value">${Number(stats.unpaid_fines || 0).toFixed(2)}</p>
            <div className="stat-footer-badge">
              Outstanding balance
            </div>
          </div>

          <div className="stat-card indigo">
            <div className="stat-header">
              <h3>Pending Holds</h3>
              <div className="stat-icon-wrapper">
                <CalendarClock size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.pending_res}</p>
            <div className="stat-footer-badge">
              Waitlist queue
            </div>
          </div>

          <div className="stat-card emerald">
            <div className="stat-header">
              <h3>Ready for Pickup</h3>
              <div className="stat-icon-wrapper">
                <Lock size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.ready_holds}</p>
            <div className="stat-footer-badge">
              Available on hold shelf
            </div>
          </div>

          <div className="stat-card sky">
            <div className="stat-header">
              <h3>Loan Allowance</h3>
              <div className="stat-icon-wrapper">
                <Layers size={20} />
              </div>
            </div>
            <p className="stat-value">{stats.borrow_limit} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>books/user</span></p>
            <div className="stat-footer-badge">
              Default policy
            </div>
          </div>
        </div>
      )}

      {/* Top Borrowed Books Section */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <h2>Most In-Demand Titles</h2>
            <p className="subtitle">Popular titles across university faculties</p>
          </div>
          <span className="badge badge-info">
            <TrendingUp size={12} /> Popular Trends
          </span>
        </div>

        {topBooks.length === 0 ? (
          <div className="empty-state">
            <p>No borrow records recorded yet.</p>
          </div>
        ) : (
          <BarChart data={topBooks.map((b) => ({ label: b.title, value: b.borrow_count }))} />
        )}
      </div>
    </div>
  );
}