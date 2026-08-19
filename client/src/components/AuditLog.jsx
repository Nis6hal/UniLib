import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
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
      addToast('Failed to load audit log', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [addToast]);

  return (
    <div>
      <h1>Audit Log</h1>

      {loading && <Spinner />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No audit entries</p>
        </div>
      )}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Table</th>
              <th>Record</th>
              <th>Action</th>
              <th>Details</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>#{e.id}</td>
                <td><span className="badge badge-info">{e.table_name}</span></td>
                <td>{e.record_id}</td>
                <td>
                  <span className={`badge ${e.action === 'INSERT' ? 'badge-success' : e.action === 'DELETE' ? 'badge-danger' : 'badge-warning'}`}>
                    {e.action}
                  </span>
                </td>
                <td className="text-sm">{e.details}</td>
                <td className="text-sm text-muted">{e.changed_at?.slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}