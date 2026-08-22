import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  BellRing,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Library
} from 'lucide-react';

export default function ReportsView() {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getMcrReport(selectedMonth);
      setReport(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load Monthly Circulation Report', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const summary = report.summary;
    let csv = `Monthly Circulation Report (MCR) - ${report.month}\n`;
    csv += `Generated at: ${new Date(report.generated_at).toLocaleString()}\n\n`;
    csv += `Metric,Value\n`;
    csv += `Total Book Loans,${summary.total_borrows}\n`;
    csv += `Total Returns,${summary.total_returns}\n`;
    csv += `Overdue Incidents,${summary.overdue_loans}\n`;
    csv += `On-Time Return Rate,${summary.on_time_return_rate}%\n`;
    csv += `Fines Assessed,$${summary.fines_assessed}\n`;
    csv += `Fines Collected,$${summary.fines_collected}\n`;
    csv += `Outstanding Balance,$${summary.outstanding_fines}\n\n`;

    csv += `Top Borrowed Titles\nTitle,Author,Genre,Loans\n`;
    (report.top_books || []).forEach((b) => {
      csv += `"${b.title}","${b.author}","${b.genre || ''}",${b.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `UniLib_MCR_${report.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported MCR report for ${report.month} to CSV`, 'success');
  };

  const handleDispatchReminders = async () => {
    setIsDispatching(true);
    try {
      const res = await api.sendReminders();
      addToast(`Dispatched ${res.total_notifications} email notifications (${res.due_alerts_dispatched} loan due alerts, ${res.hold_alerts_dispatched} hold pickup alerts)`, 'success');
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const shiftMonth = (delta) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newMonthStr = date.toISOString().slice(0, 7);
    setSelectedMonth(newMonthStr);
  };

  const formatMonthName = (mStr) => {
    if (!mStr) return '';
    const [y, m] = mStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-in">
      {/* Section Header with Controls */}
      <div className="section-header no-print">
        <div>
          <h1 className="page-title">Monthly Circulation Reports (MCR)</h1>
          <p className="subtitle">Official university circulation summaries, overdue analysis, and audit exports</p>
        </div>

        <div className="section-actions">
          {/* Email Reminders Trigger Button */}
          <button className="secondary" onClick={handleDispatchReminders} disabled={isDispatching}>
            <BellRing size={16} color="var(--warning)" />
            {isDispatching ? 'Dispatching...' : 'Dispatch Automated Reminders'}
          </button>

          {/* Export CSV */}
          <button className="secondary" onClick={handleExportCSV} disabled={!report}>
            <Download size={16} /> Export CSV
          </button>

          {/* Print PDF */}
          <button onClick={handlePrint} disabled={!report}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Month Navigation Strip */}
      <div className="card no-print" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Report Period: <strong style={{ color: 'var(--primary)' }}>{formatMonthName(selectedMonth)}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="ghost" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
          />
          <button className="ghost" onClick={() => shiftMonth(1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading && <Spinner message="Generating audited circulation report..." />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && report && (
        <div className="printable-report">
          {/* Letterhead Banner */}
          <div className="mcr-letterhead">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="sidebar-brand-icon" style={{ width: 48, height: 48 }}>
                <Library size={26} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
                  UniLib University Library System
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Division of Academic Resources & Library Services
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="badge badge-info" style={{ marginBottom: 4 }}>
                <ShieldCheck size={12} /> OFFICIAL REPORT
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                MCR-{report.month}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Generated: {new Date(report.generated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card indigo">
              <div className="stat-header">
                <h3>Total Loans</h3>
                <div className="stat-icon-wrapper">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="stat-value">{report.summary.total_borrows}</p>
              <div className="stat-footer-badge">Books checked out</div>
            </div>

            <div className="stat-card emerald">
              <div className="stat-header">
                <h3>Check-Ins / Returns</h3>
                <div className="stat-icon-wrapper">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="stat-value">{report.summary.total_returns}</p>
              <div className="stat-footer-badge">Completed loans</div>
            </div>

            <div className="stat-card sky">
              <div className="stat-header">
                <h3>On-Time Rate</h3>
                <div className="stat-icon-wrapper">
                  <Layers size={20} />
                </div>
              </div>
              <p className="stat-value">{report.summary.on_time_return_rate}%</p>
              <div className="stat-footer-badge">Compliance percentage</div>
            </div>

            <div className="stat-card amber">
              <div className="stat-header">
                <h3>Fine Revenue</h3>
                <div className="stat-icon-wrapper">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="stat-value">${report.summary.fines_collected.toFixed(2)}</p>
              <div className="stat-footer-badge">
                Collected (Assessed: ${report.summary.fines_assessed.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Grid of Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Top Borrowed Titles */}
            <div className="card">
              <h3>Top Borrowed Titles</h3>
              {report.top_books.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No loans recorded for this period.</p>
              ) : (
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Genre</th>
                      <th style={{ textAlign: 'right' }}>Loans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_books.map((b, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{b.title}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>by {b.author}</div>
                        </td>
                        <td>{b.genre || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{b.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Most Active Borrowers */}
            <div className="card">
              <h3>Most Active Members</h3>
              {report.top_members.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No member activity recorded.</p>
              ) : (
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Loans Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_members.map((m, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{m.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${m.role === 'admin' ? 'badge-danger' : m.role === 'librarian' ? 'badge-warning' : 'badge-info'}`}>
                            {m.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{m.loans_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Circulation by Subject / Genre */}
          <div className="card">
            <h3>Circulation Breakdown by Subject Area</h3>
            {report.genre_breakdown.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {report.genre_breakdown.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{g.genre}</span>
                    <span className="badge badge-info">{g.count} loans</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
