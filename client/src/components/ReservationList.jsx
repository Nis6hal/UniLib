import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  CalendarClock,
  PackageCheck,
  Plus,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function ReservationList({ currentUser }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [createForm, setCreateForm] = useState({ book_id: '', user_id: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';

  async function load() {
    try {
      setLoading(true);
      const params = { status: 'all' };
      if (isStudent && currentUser?.id) {
        params.user_id = currentUser.id;
      }
      const data = await api.getReservations(params);
      setReservations(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = {
        book_id: createForm.book_id,
        user_id: isStudent ? currentUser.id : createForm.user_id
      };
      const res = await api.createReservation(payload);
      setCreateForm({ book_id: '', user_id: '' });
      addToast(`Reservation queued! Position #${res.queue_position} in line.`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCollect = async (id) => {
    setIsProcessing(true);
    try {
      await api.collectReservation(id);
      addToast('Hold collected & checked out as active loan!', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this book reservation?')) return;
    setIsProcessing(true);
    try {
      await api.cancelReservation(id);
      addToast('Reservation cancelled', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpire = async () => {
    setIsProcessing(true);
    try {
      const res = await api.expireHolds();
      addToast(`Expired holds processed (${res.expired || 0} updated)`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">
            {isStudent ? 'My Book Holds & Reservations' : 'Book Reservations & Holds'}
          </h1>
          <p className="subtitle">
            {isStudent
              ? 'Track your position in book queues and collect ready holds'
              : 'Manage waitlist queues, hold shelf allocations, and automatic expirations'}
          </p>
        </div>

        {!isStudent && (
          <button className="secondary" onClick={handleExpire} disabled={isProcessing}>
            <Zap size={15} color="var(--warning)" /> Auto-Expire Stale Holds
          </button>
        )}
      </div>

      {/* Place Reservation Form (Only for librarians or students wanting quick ID entry) */}
      {!isStudent && (
        <form className="form-card" onSubmit={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <h3>Place a Reservation Queue Request</h3>
            <p className="subtitle">Queue a member for an unavailable book copy</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Book ID</label>
              <input
                required
                type="number"
                placeholder="e.g. 3"
                value={createForm.book_id}
                onChange={(e) => setCreateForm({ ...createForm, book_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Member ID</label>
              <input
                required
                type="number"
                placeholder="e.g. 1"
                value={createForm.user_id}
                onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={isProcessing}>
            <Plus size={16} />
            {isProcessing ? 'Queueing...' : 'Place Reservation'}
          </button>
        </form>
      )}

      {/* Reservations List */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <h2>{isStudent ? 'My Queue & Hold Status' : 'All Hold Records'}</h2>

          {/* Status Filter Chips */}
          <div className="view-toggle">
            {['All', 'Ready', 'Pending', 'Collected', 'Cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? 'active' : ''}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading && <Spinner message="Loading reservation records..." />}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && filteredReservations.length === 0 && (
          <div className="empty-state">
            <CalendarClock className="empty-icon" />
            <p>{isStudent ? 'You have no active holds or reservations.' : 'No reservations found'}</p>
          </div>
        )}

        {!loading && !error && filteredReservations.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hold ID</th>
                  {!isStudent && <th>Member</th>}
                  <th>Book Title</th>
                  <th>Status</th>
                  <th>Reserved Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((r) => (
                  <tr key={r.id}>
                    <td className="td-id">#{r.id}</td>
                    {!isStudent && <td><strong>{r.user_name}</strong></td>}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.title}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'ready'
                            ? 'badge-success'
                            : r.status === 'pending'
                            ? 'badge-warning'
                            : r.status === 'collected'
                            ? 'badge-info'
                            : 'badge-danger'
                        }`}
                      >
                        {r.status === 'ready' && <PackageCheck size={12} />}
                        {r.status === 'pending' && <Clock size={12} />}
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="td-id">{r.reserved_at?.slice(0, 10)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        {r.status === 'ready' && (
                          <button
                            className="success"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleCollect(r.id)}
                            disabled={isProcessing}
                          >
                            <PackageCheck size={13} /> Collect Hold
                          </button>
                        )}
                        {r.status === 'pending' && (
                          <button
                            className="danger"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleCancel(r.id)}
                            disabled={isProcessing}
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
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