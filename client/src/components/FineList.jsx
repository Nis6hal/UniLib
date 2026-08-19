import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function FineList() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getFines();
      setFines(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load fines', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [addToast]);

  const handlePay = async (id) => {
    try {
      await api.payFine(id);
      addToast('Fine paid successfully', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div>
      <h1>Fines</h1>

      {loading && <Spinner />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && fines.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>No fines</p>
        </div>
      )}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Book</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((f) => (
              <tr key={f.id}>
                <td>#{f.id}</td>
                <td>{f.user_name}</td>
                <td>{f.title}</td>
                <td><strong>${f.amount.toFixed(2)}</strong></td>
                <td>
                  {f.paid ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-danger">Unpaid</span>
                  )}
                </td>
                <td className="text-sm text-muted">{f.created_at?.slice(0, 10)}</td>
                <td>
                  {!f.paid && (
                    <button className="success" onClick={() => handlePay(f.id)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}