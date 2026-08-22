import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  ShieldCheck,
  Activity,
  Search,
  Database,
  Clock,
  Filter
} from 'lucide-react';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getAudit();
      setEntries(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load system audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [addToast]);

  const filteredEntries = entries.filter((e) => {
    const query = search.toLowerCase();
    return (
      e.table_name?.toLowerCase().includes(query) ||
      e.action?.toLowerCase().includes(query) ||
      e.details?.toLowerCase().includes(query) ||
      String(e.record_id).includes(query)
    );
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">System Audit Log</h1>
          <p className="subtitle">Immutable audit trail of database operations, catalog updates, and circulation logs</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="search-toolbar">
        <div className="search-box-wrapper" style={{ maxWidth: 400 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search audit trail by table, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <Spinner message="Loading audit trail records..." />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && filteredEntries.length === 0 && (
        <div className="empty-state">
          <ShieldCheck className="empty-icon" />
          <p>No audit entries recorded</p>
        </div>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Target Table</th>
                <th>Record ID</th>
                <th>Operation</th>
                <th>Change Summary</th>
                <th style={{ textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => (
                <tr key={e.id}>
                  <td className="td-id">#{e.id}</td>
                  <td>
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Database size={11} /> {e.table_name}
                    </span>
                  </td>
                  <td className="td-id">#{e.record_id}</td>
                  <td>
                    <span
                      className={`badge ${
                        e.action === 'INSERT'
                          ? 'badge-success'
                          : e.action === 'DELETE'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {e.details || '—'}
                    </span>
                  </td>
                  <td className="td-id" style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="var(--text-muted)" />
                      {e.changed_at ? new Date(e.changed_at).toLocaleString() : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}