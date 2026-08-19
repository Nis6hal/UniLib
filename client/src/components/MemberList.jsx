import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'student' });
  const [formError, setFormError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState('');
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setMembers(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [addToast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createUser(form);
      setShowForm(false);
      setForm({ name: '', email: '', role: 'student' });
      addToast('Member added successfully', 'success');
      load();
    } catch (e) {
      setFormError(e.message);
      addToast(e.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.deleteUser(id);
      addToast('Member removed', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleViewProfile = async (id) => {
    try {
      const data = await api.getMemberProfile(id);
      setProfile(data);
      setProfileId(id);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Members</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Member'}
        </button>
      </div>

      {showForm && (
        <form className="form-card animate-in" onSubmit={handleCreate}>
          <h3>Add Member</h3>
          {formError && <p className="error">{formError}</p>}
          <div className="form-grid">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit">Add Member</button>
        </form>
      )}

      {loading && <Spinner />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>#{m.id}</td>
                <td><strong>{m.name}</strong></td>
                <td className="text-sm text-muted">{m.email}</td>
                <td><span className={`badge ${m.role === 'admin' ? 'badge-danger' : m.role === 'librarian' ? 'badge-warning' : 'badge-info'}`}>{m.role}</span></td>
                <td className="text-sm text-muted">{m.joined_at?.slice(0, 10)}</td>
                <td>
                  <button onClick={() => handleViewProfile(m.id)}>Profile</button>
                  <button className="danger" onClick={() => handleDelete(m.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {profile && (
        <div className="modal-overlay" onClick={() => setProfile(null)}>
          <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
            <h2>Profile: {profile.user.name}</h2>
            <button className="modal-close" onClick={() => setProfile(null)}>×</button>
            <div className="profile-grid">
              <div><strong>Email:</strong> {profile.user.email}</div>
              <div><strong>Role:</strong> {profile.user.role}</div>
              <div><strong>Active Borrows:</strong> {profile.stats.active_count} / {profile.stats.borrow_limit}</div>
              <div><strong>Total Borrowed:</strong> {profile.stats.total_borrowed}</div>
              <div><strong>Unpaid Fines:</strong> ${profile.stats.unpaid_fines.toFixed(2)}</div>
              <div><strong>Favourite Genre:</strong> {profile.stats.favourite_genre || '—'}</div>
            </div>

            {profile.active_borrows && profile.active_borrows.length > 0 && (
              <div className="section">
                <h3>Active Borrows</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Book</th><th>Author</th><th>Due</th></tr>
                  </thead>
                  <tbody>
                    {profile.active_borrows.map((b) => (
                      <tr key={b.id}>
                        <td>{b.title}</td>
                        <td>{b.author}</td>
                        <td>{b.due_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {profile.reservations && profile.reservations.length > 0 && (
              <div className="section">
                <h3>Active Reservations</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Book</th><th>Status</th><th>Reserved</th></tr>
                  </thead>
                  <tbody>
                    {profile.reservations.map((r) => (
                      <tr key={r.id}>
                        <td>{r.title}</td>
                        <td><span className={`badge ${r.status === 'ready' ? 'badge-warning' : 'badge-info'}`}>{r.status}</span></td>
                        <td>{r.reserved_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}