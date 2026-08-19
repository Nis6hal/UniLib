import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {data.map((d) => (
        <div key={d.label} className="chart-row">
          <span className="chart-label" title={d.label}>{d.label}</span>
          <div className="chart-bar" style={{ flex: 1 }}>
            <div className="chart-bar-fill" style={{ width: `${(d.value / max) * 100}%` }}></div>
          </div>
          <span className="chart-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getStats();
        setStats(data);
        setError(null);
      } catch (e) {
        setError(e.message);
        addToast('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  if (loading) return <Spinner />;
  if (error) return <p className="error">Error: {error}</p>;
  if (!stats) return null;

  const topBooks = stats.top_books || [];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <h3>Total Books</h3>
          <p>{stats.total_books}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>Total Members</h3>
          <p>{stats.total_users}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <h3>Active Borrows</h3>
          <p>{stats.active_borrows}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <h3>Overdue</h3>
          <p>{stats.overdue}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <h3>Unpaid Fines</h3>
          <p>${stats.unpaid_fines.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <h3>Pending Reservations</h3>
          <p>{stats.pending_res}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <h3>Ready Holds</h3>
          <p>{stats.ready_holds}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📏</div>
          <h3>Borrow Limit</h3>
          <p>{stats.borrow_limit}</p>
        </div>
      </div>

      {topBooks.length > 0 && (
        <div className="section animate-in">
          <h2>Top Borrowed Books</h2>
          <BarChart data={topBooks.map((b) => ({ label: b.title, value: b.borrow_count }))} />
        </div>
      )}
    </div>
  );
}