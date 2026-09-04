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
  BookMarked,
  FileCode,
  GraduationCap,
  BellRing,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Zap,
  Activity,
  Archive,
  BookOpenCheck
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="chart-label" title={d.label}>
                {d.label}
              </div>
              {d.subtitle && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.subtitle}</div>
              )}
            </div>
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

export default function Dashboard({ currentUser, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';
  const [currentlyReading, setCurrentlyReading] = useState([]);

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
    if (currentUser?.id) {
      api.getCurrentlyReading(currentUser.id).then(data => {
        setCurrentlyReading(data.currently_reading || []);
      }).catch(() => {});
    }
  }, [currentUser]);

  const handleRenewMyLoan = async (id) => {
    try {
      const res = await api.renewBorrow(id, {
        role: currentUser?.role,
        operator_id: currentUser?.id
      });
      if (res.status === 'pending_approval') {
        addToast(res.message || 'Renewal requested! A librarian will verify and approve your extension.', 'info');
      } else {
        addToast('Loan renewed for +14 days!', 'success');
      }
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleSendReminders = async () => {
    try {
      setActionLoading(true);
      const res = await api.sendReminders();
      addToast(`Dispatched ${res.total_notifications} email reminders!`, 'success');
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHealCopies = async () => {
    try {
      setActionLoading(true);
      const res = await api.healCopies();
      addToast(`System check complete: ${res.copies_released} orphaned copies restored.`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner message="Loading your university dashboard..." />;
  if (error) return <p className="error">Error loading metrics: {error}</p>;
  if (!stats) return null;

  const topBooks = stats.top_books || [];
  const myLoans = stats.my_loans || [];
  const recentCirculations = stats.recent_circulations || [];

  return (
    <div className="animate-in dashboard-page">
      {/* Header Banner */}
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isStudent ? `Welcome, ${currentUser?.name}` : 'Institutional Executive Dashboard'}
            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
              {isStudent ? 'Scholar Portal' : 'Admin Staff'}
            </span>
          </h1>
          <p className="subtitle">
            {isStudent
              ? 'Real-time circulation metrics, active physical loans, and academic study resources'
              : 'Live campus catalog inventory, daily circulations, and library operations oversight'}
          </p>
        </div>
      </div>

      {/* Student Personal Dashboard */}
      {isStudent ? (
        <>
          {/* Student Stat Widgets */}
          <div className="stats-grid">
            <div className="stat-card indigo">
              <div className="stat-header">
                <h3>My Active Loans</h3>
                <div className="stat-icon-wrapper">
                  <Repeat size={19} />
                </div>
              </div>
              <p className="stat-value">
                {stats.active_borrows} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {stats.borrow_limit} max</span>
              </p>
              <div className="stat-footer-badge">
                <Layers size={12} /> {stats.borrow_limit - stats.active_borrows} slots available
              </div>
            </div>

            <div className="stat-card rose">
              <div className="stat-header">
                <h3>Overdue Loans</h3>
                <div className="stat-icon-wrapper">
                  <AlertTriangle size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.overdue}</p>
              <div className="stat-footer-badge" style={{ color: stats.overdue > 0 ? '#fb7185' : 'var(--success)' }}>
                {stats.overdue > 0 ? `${stats.overdue} require immediate return` : 'All loans in good standing'}
              </div>
            </div>

            <div className="stat-card amber">
              <div className="stat-header">
                <h3>Unpaid Fines</h3>
                <div className="stat-icon-wrapper">
                  <DollarSign size={19} />
                </div>
              </div>
              <p className="stat-value">${Number(stats.unpaid_fines || 0).toFixed(2)}</p>
              <div className="stat-footer-badge">
                {stats.unpaid_fines > 0 ? 'Assessed daily fines' : 'Zero balance due'}
              </div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-header">
                <h3>Ready For Pickup</h3>
                <div className="stat-icon-wrapper">
                  <Lock size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.ready_holds}</p>
              <div className="stat-footer-badge">
                {stats.ready_holds > 0 ? `${stats.ready_holds} held on circulation shelf` : 'No active holds ready'}
              </div>
            </div>
          </div>

          {/* Quick Academic Navigation Launchpad */}
          <div className="quick-actions-bar card" style={{ marginBottom: 24, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--primary)" />
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Scholar Launchpad:</strong>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('curriculum')}
                >
                  <GraduationCap size={14} /> Course Curriculum
                </button>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('ebooks')}
                >
                  <BookOpenCheck size={14} /> Digital E-Library
                </button>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('notes')}
                >
                  <BookMarked size={14} /> Study Notes Hub ({stats.my_annotations_count || 0})
                </button>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('books')}
                >
                  <BookOpen size={14} /> Browse Catalog
                </button>
              </div>
            </div>
          </div>

          {/* Currently Reading Digital Books */}
          {currentlyReading.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-header" style={{ marginBottom: 14 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} color="var(--primary)" /> Continue Reading
                  </h2>
                  <p className="subtitle">Resume your digital books from where you left off</p>
                </div>
                <button
                  className="secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('ebooks')}
                >
                  <BookOpenCheck size={14} /> Open E-Library
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {currentlyReading.slice(0, 4).map((item) => {
                  const pct = Math.round(item.progress_pct || 0);
                  return (
                    <div
                      key={item.book_id}
                      style={{
                        background: 'rgba(212,175,55,0.03)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={() => onNavigate && onNavigate('ebooks')}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)'; }}
                    >
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2, background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #f59e0b)', transition: 'width 0.3s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <h4 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, marginLeft: 8 }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.author} • Page {item.current_page}/{item.total_pages}</span>
                        <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <ArrowRight size={10} /> Resume
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student's Active Loans Table */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <div>
                <h2>My Borrowed Physical Volumes</h2>
                <p className="subtitle">Books currently checked out under your university scholar ID</p>
              </div>
              <span className="badge badge-info">
                {myLoans.length} active {myLoans.length === 1 ? 'loan' : 'loans'}
              </span>
            </div>

            {myLoans.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 20px' }}>
                <BookOpen className="empty-icon" size={32} />
                <p style={{ margin: '8px 0', color: 'var(--text-main)', fontWeight: 600 }}>No Active Loans</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  You do not currently have any physical books checked out.
                </span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title & Genre</th>
                      <th>Borrowed Date</th>
                      <th>Due Date & Status</th>
                      <th>Renewals</th>
                      <th style={{ textAlign: 'right' }}>Circulation Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLoans.map((l) => {
                      const isOverdue = new Date(l.due_at) < new Date();
                      const daysRemaining = Math.ceil((new Date(l.due_at) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="td-title">
                              <span
                                className="book-spine-dot"
                                style={{ backgroundColor: l.cover_color || 'var(--primary)' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>{l.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  by {l.author} • <span style={{ color: 'var(--primary)' }}>{l.genre || 'Academic'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="td-id">{l.borrowed_at?.slice(0, 10)}</td>
                          <td>
                            <span className={`badge ${isOverdue ? 'badge-danger' : daysRemaining <= 2 ? 'badge-warning' : 'badge-success'}`}>
                              {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                              {isOverdue ? `Overdue (${Math.abs(daysRemaining)}d ago)` : `Due in ${daysRemaining} days (${l.due_at?.slice(0, 10)})`}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="badge badge-info">{l.renewals || 0} / 2 used</span>
                              {l.renewal_status === 'pending_approval' && (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                  Pending Verification
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="secondary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              onClick={() => handleRenewMyLoan(l.id)}
                              disabled={l.renewals >= 2 || l.renewal_status === 'pending_approval'}
                              title={l.renewal_status === 'pending_approval' ? 'Verification in progress' : ''}
                            >
                              <RotateCw size={13} /> {l.renewal_status === 'pending_approval' ? 'Pending Approval' : l.renewals >= 2 ? 'Max Renewed' : 'Renew (+14 Days)'}
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
        <>
          {/* Key Admin Inventory Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card indigo">
              <div className="stat-header">
                <h3>Physical Catalog</h3>
                <div className="stat-icon-wrapper">
                  <BookOpen size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.total_books}</p>
              <div className="stat-footer-badge">
                <Layers size={12} /> {stats.total_copies} total physical copies
              </div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-header">
                <h3>Available Copies</h3>
                <div className="stat-icon-wrapper">
                  <CheckCircle2 size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.available_copies}</p>
              <div className="stat-footer-badge">
                <Archive size={12} /> Ready for checkout on shelf
              </div>
            </div>

            <div className="stat-card sky">
              <div className="stat-header">
                <h3>Active Loans</h3>
                <div className="stat-icon-wrapper">
                  <Repeat size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.active_borrows}</p>
              <div className="stat-footer-badge">
                <TrendingUp size={12} /> {stats.today_borrows || 0} checked out today
              </div>
            </div>

            <div className="stat-card rose">
              <div className="stat-header">
                <h3>Overdue Loans</h3>
                <div className="stat-icon-wrapper">
                  <AlertTriangle size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.overdue}</p>
              <div className="stat-footer-badge" style={{ color: stats.overdue > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                {stats.overdue > 0 ? 'Fines accruing daily' : 'Zero overdue items'}
              </div>
            </div>

            <div className="stat-card amber">
              <div className="stat-header">
                <h3>Unpaid Fines</h3>
                <div className="stat-icon-wrapper">
                  <DollarSign size={19} />
                </div>
              </div>
              <p className="stat-value">${Number(stats.unpaid_fines || 0).toFixed(2)}</p>
              <div className="stat-footer-badge">
                ${Number(stats.total_fines_collected || 0).toFixed(2)} total collected
              </div>
            </div>

            <div className="stat-card indigo">
              <div className="stat-header">
                <h3>Digital Repository</h3>
                <div className="stat-icon-wrapper">
                  <BookOpenCheck size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.total_digital_books}</p>
              <div className="stat-footer-badge">
                <FileCode size={12} /> E-books & notes indexed
              </div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-header">
                <h3>Curriculum & Theses</h3>
                <div className="stat-icon-wrapper">
                  <GraduationCap size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.total_courses}</p>
              <div className="stat-footer-badge">
                {stats.total_research_papers || 0} research theses indexed
              </div>
            </div>

            <div className="stat-card sky">
              <div className="stat-header">
                <h3>Campus Members</h3>
                <div className="stat-icon-wrapper">
                  <Users size={19} />
                </div>
              </div>
              <p className="stat-value">{stats.total_users}</p>
              <div className="stat-footer-badge">
                {stats.total_students || 0} student scholars
              </div>
            </div>
          </div>

          {/* Admin Quick Action Center */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>
                  Administrative Operations & Automated Systems
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Execute automated overdue email alerts, integrity health checks, and quick catalog routines
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  onClick={handleSendReminders}
                  disabled={actionLoading}
                >
                  <BellRing size={14} /> Send Due Date Email Alerts
                </button>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  onClick={handleHealCopies}
                  disabled={actionLoading}
                >
                  <ShieldCheck size={14} /> Integrity Heal Copies
                </button>
                <button
                  className="secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  onClick={() => onNavigate && onNavigate('reports')}
                >
                  <TrendingUp size={14} /> Monthly MCR Reports
                </button>
              </div>
            </div>
          </div>

          {/* Real Live Physical Inventory Distribution Bar */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div>
                <h2>Physical Copies Inventory Breakdown</h2>
                <p className="subtitle">Real-time status of all {stats.total_copies} physical catalog copies</p>
              </div>
              <span className="badge badge-primary">Live Inventory</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 16, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                <div
                  style={{
                    width: `${stats.total_copies > 0 ? (stats.available_copies / stats.total_copies) * 100 : 0}%`,
                    background: 'var(--success)',
                    transition: 'width 0.4s ease'
                  }}
                  title={`Available: ${stats.available_copies}`}
                />
                <div
                  style={{
                    width: `${stats.total_copies > 0 ? (stats.borrowed_copies / stats.total_copies) * 100 : 0}%`,
                    background: 'var(--info)',
                    transition: 'width 0.4s ease'
                  }}
                  title={`Borrowed: ${stats.borrowed_copies}`}
                />
                <div
                  style={{
                    width: `${stats.total_copies > 0 ? (stats.reserved_copies / stats.total_copies) * 100 : 0}%`,
                    background: 'var(--warning)',
                    transition: 'width 0.4s ease'
                  }}
                  title={`Reserved: ${stats.reserved_copies}`}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)' }} />
                <span>Available on Shelf: <strong>{stats.available_copies}</strong> ({stats.total_copies > 0 ? Math.round((stats.available_copies / stats.total_copies) * 100) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--info)' }} />
                <span>In Active Circulation: <strong>{stats.borrowed_copies}</strong> ({stats.total_copies > 0 ? Math.round((stats.borrowed_copies / stats.total_copies) * 100) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--warning)' }} />
                <span>Held for Reservation: <strong>{stats.reserved_copies}</strong> ({stats.total_copies > 0 ? Math.round((stats.reserved_copies / stats.total_copies) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* Live Recent Circulation Events Stream */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div>
                <h2>Live Circulation Transactions Stream</h2>
                <p className="subtitle">Real-time record of latest checkouts and returns across campus</p>
              </div>
              <span className="badge badge-info">
                <Activity size={12} /> Live Event Feed
              </span>
            </div>

            {recentCirculations.length === 0 ? (
              <div className="empty-state">
                <p>No recent circulations recorded.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Scholar / Member</th>
                      <th>Book Title</th>
                      <th>Borrowed Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCirculations.map((tx) => {
                      const isReturned = !!tx.returned_at;
                      const isOverdue = !isReturned && new Date(tx.due_at) < new Date();
                      return (
                        <tr key={tx.id}>
                          <td className="td-id">TX-#{tx.id}</td>
                          <td>
                            <strong>{tx.member_name}</strong>
                            <span className="badge-mini" style={{ marginLeft: 6 }}>{tx.member_role}</span>
                          </td>
                          <td>{tx.book_title}</td>
                          <td>{tx.borrowed_at?.slice(0, 16)}</td>
                          <td>{tx.due_at?.slice(0, 10)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`badge ${isReturned ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-primary'}`}>
                              {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active Loan'}
                            </span>
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
      )}

      {/* Top Borrowed Titles Across Campus */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <h2>Most In-Demand Academic Titles</h2>
            <p className="subtitle">Most frequently checked-out physical volumes across faculties</p>
          </div>
          <span className="badge badge-info">
            <TrendingUp size={12} /> Demand Index
          </span>
        </div>

        {topBooks.length === 0 ? (
          <div className="empty-state">
            <p>No borrow activity recorded yet.</p>
          </div>
        ) : (
          <BarChart
            data={topBooks.map((b) => ({
              label: b.title,
              subtitle: `by ${b.author} • ${b.genre || 'Academic'}`,
              value: b.borrow_count
            }))}
          />
        )}
      </div>
    </div>
  );
}