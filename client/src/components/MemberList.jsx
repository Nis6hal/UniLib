import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Eye,
  Shield,
  BookOpen,
  Calendar,
  DollarSign,
  Heart,
  X,
  Mail,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function MemberList({ currentUser }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'student' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setMembers(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load member records', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.createUser(form);
      setShowModal(false);
      setForm({ name: '', email: '', role: 'student' });
      addToast(`Member "${form.name}" registered successfully`, 'success');
      load();
    } catch (e) {
      setFormError(e.message);
      addToast(e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove member "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      addToast(`Member "${name}" removed`, 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      addToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
      load();
      if (profile && profile.user.id === userId) {
        setProfile({ ...profile, user: { ...profile.user, role: newRole } });
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleViewProfile = async (id) => {
    try {
      setProfileLoading(true);
      const data = await api.getMemberProfile(id);
      setProfile(data);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredMembers = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.name?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      String(m.id).includes(query);
    const matchesRole = selectedRole === 'All' || m.role?.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Members & Access Directory</h1>
          <p className="subtitle">Manage enrolled university members, loan quotas, and access control permissions</p>
        </div>

        <button onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Register Member
        </button>
      </div>

      {/* Search & Role Filters */}
      <div className="search-toolbar">
        <div className="search-box-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search member by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role Filters */}
        <div className="view-toggle">
          {['All', 'Student', 'Librarian', 'Admin'].map((r) => (
            <button
              key={r}
              type="button"
              className={selectedRole === r ? 'active' : ''}
              onClick={() => setSelectedRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner message="Loading member directory..." />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && filteredMembers.length === 0 && (
        <div className="empty-state">
          <Users className="empty-icon" />
          <p>No members found matching your search</p>
        </div>
      )}

      {!loading && !error && filteredMembers.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role & Permissions</th>
                <th>Member Since</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`user-avatar ${m.role}`}>
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                        <div className="td-id">ID #{m.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Mail size={13} color="var(--text-muted)" /> {m.email}
                    </span>
                  </td>
                  <td>
                    {/* Role Promotion Selector */}
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-sm)',
                        background: m.role === 'admin' ? 'rgba(244,63,94,0.15)' : m.role === 'librarian' ? 'rgba(212,175,55,0.18)' : 'rgba(56,189,248,0.15)',
                        color: m.role === 'admin' ? '#fb7185' : m.role === 'librarian' ? '#d4af37' : '#38bdf8',
                        borderColor: 'rgba(212,175,55,0.25)',
                        fontWeight: 600
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="librarian">Librarian</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="td-id">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="secondary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleViewProfile(m.id)}
                      >
                        <Eye size={13} /> Profile
                      </button>
                      <button
                        className="danger"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleDelete(m.id, m.name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Member Modal (Staff Access) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Register New Member</h2>
                <p className="subtitle">Add a verified user to the university library ledger</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <p className="error">{formError}</p>}

            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    required
                    placeholder="e.g. Johnathan Davis"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>University Email</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. j.davis@uni.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Initial Role Assignment</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="student">Student (Standard Limit)</option>
                    <option value="librarian">Librarian (Staff Access)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {profile && (
        <div className="modal-overlay" onClick={() => setProfile(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`user-avatar ${profile.user.role}`} style={{ width: 44, height: 44, fontSize: '1rem' }}>
                  {getInitials(profile.user.name)}
                </div>
                <div>
                  <h2>{profile.user.name}</h2>
                  <p className="subtitle">{profile.user.email} • ID #{profile.user.id}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setProfile(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Profile Stats Grid */}
            <div className="profile-grid">
              <div className="profile-item">
                <span className="profile-item-label">Role & Access</span>
                <span className="profile-item-value">
                  <select
                    value={profile.user.role}
                    onChange={(e) => handleRoleChange(profile.user.id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="student">Student</option>
                    <option value="librarian">Librarian</option>
                    <option value="admin">Administrator</option>
                  </select>
                </span>
              </div>
              <div className="profile-item">
                <span className="profile-item-label">Active Loans Allowance</span>
                <span className="profile-item-value">
                  {profile.stats.active_count} / {profile.stats.borrow_limit} books
                </span>
              </div>
              <div className="profile-item">
                <span className="profile-item-label">Total Loans (All-Time)</span>
                <span className="profile-item-value">{profile.stats.total_borrowed} books</span>
              </div>
              <div className="profile-item">
                <span className="profile-item-label">Outstanding Fines</span>
                <span className="profile-item-value" style={{ color: profile.stats.unpaid_fines > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ${Number(profile.stats.unpaid_fines || 0).toFixed(2)}
                </span>
              </div>
              <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                <span className="profile-item-label">Favorite Genre</span>
                <span className="profile-item-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Heart size={14} color="var(--primary)" /> {profile.stats.favourite_genre || 'None recorded yet'}
                </span>
              </div>
            </div>

            {/* Current Active Loans */}
            <div style={{ marginBottom: 24 }}>
              <h3>Currently Borrowed Titles</h3>
              {profile.active_borrows.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
                  No active loans currently checked out.
                </p>
              ) : (
                <div className="table-responsive" style={{ marginTop: 8 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Due Date</th>
                        <th>Fine Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.active_borrows.map((b) => {
                        const isOverdue = new Date(b.due_at) < new Date();
                        return (
                          <tr key={b.id}>
                            <td>{b.title}</td>
                            <td>
                              <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                                {b.due_at?.slice(0, 10)}
                              </span>
                            </td>
                            <td>
                              {isOverdue ? (
                                <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Overdue</span>
                              ) : (
                                <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>On Time</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Active Reservations */}
            <div style={{ marginBottom: 20 }}>
              <h3>Waitlist Reservations</h3>
              {profile.reservations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
                  No active reservations on hold.
                </p>
              ) : (
                <div className="table-responsive" style={{ marginTop: 8 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Reserved Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.reservations.map((r) => (
                        <tr key={r.id}>
                          <td>{r.title}</td>
                          <td>
                            <span className={`badge ${r.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="td-id">{r.reserved_at?.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}