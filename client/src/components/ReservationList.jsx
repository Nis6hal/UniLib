import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createForm, setCreateForm] = useState({ book_id: '', user_id: '' });
  const [msg, setMsg] = useState('');
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getReservations();
      setReservations(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [addToast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.createReservation(createForm);
      setCreateForm({ book_id: '', user_id: '' });
      setMsg('Reservation created!');
      addToast('Reservation created', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  const handleCollect = async (id) => {
    try {
      await api.collectReservation(id);
      setMsg('Reservation collected and borrow created!');
      addToast('Hold collected', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.cancelReservation(id);
      setMsg('Reservation cancelled!');
      addToast('Reservation cancelled', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  const handleExpire = async () => {
    try {
      await api.expireHolds();
      setMsg('Expired holds processed!');
      addToast('Holds expired', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  return (
    <div>
      <h1>Reservations</h1>

      <form className="form-card animate-in" onSubmit={handleCreate}>
        <h3>Create Reservation</h3>
        {msg && <p className={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</p>}
        <div className="form-grid">
          <input required type="number" placeholder="Book ID" value={createForm.book_id} onChange={(e) => setCreateForm({ ...createForm, book_id: e.target.value })} />
          <input required type="number" placeholder="User ID" value={createForm.user_id} onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })} />
        </div>
        <button type="submit">Reserve</button>
      </form>

      <div className="section">
        <div className="section-header">
          <h2>All Reservations</h2>
          <button onClick={handleExpire}>Expire Ready Holds</button>
        </div>

        {loading && <Spinner />}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && reservations.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No reservations</p>
          </div>
        )}

        {!loading && !error && reservations.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Book</th>
                <th>Status</th>
                <th>Reserved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.user_name}</td>
                  <td>{r.title}</td>
                  <td>
                    <span className={`badge ${r.status === 'ready' ? 'badge-warning' : r.status === 'pending' ? 'badge-info' : r.status === 'collected' ? 'badge-success' : 'badge-danger'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.reserved_at?.slice(0, 10)}</td>
                  <td>
                    {r.status === 'ready' && (
                      <button className="success" onClick={() => handleCollect(r.id)}>Collect</button>
                    )}
                    {r.status === 'pending' && (
                      <button className="danger" onClick={() => handleCancel(r.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}