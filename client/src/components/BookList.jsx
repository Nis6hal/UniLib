import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  LayoutGrid,
  List,
  Tag,
  ArrowDownLeft,
  CalendarClock,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Info,
  Clock,
  BookMarked
} from 'lucide-react';

export default function BookList({ currentUser }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedBookDrawer, setSelectedBookDrawer] = useState(null);

  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    genre: '',
    copies: 1,
    cover_color: '#d4af37',
    cover_image: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const isStudent = currentUser?.role === 'student';

  async function load() {
    try {
      setLoading(true);
      const data = await api.getBooks(search);
      setBooks(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load catalog books', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleStudentBorrow = async (bookId, title) => {
    if (!currentUser?.id) {
      addToast('Please sign in to reserve books', 'error');
      return;
    }
    try {
      await api.borrowBook({ book_id: bookId, user_id: currentUser.id, days: 14 });
      addToast(`"${title}" reserved! Visit the library counter to pick it up within 3 days.`, 'success');
      if (selectedBookDrawer?.id === bookId) setSelectedBookDrawer(null);
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleStudentReserve = async (bookId, title) => {
    if (!currentUser?.id) {
      addToast('Please sign in to place reservations', 'error');
      return;
    }
    try {
      const res = await api.createReservation({ book_id: bookId, user_id: currentUser.id });
      addToast(`Hold placed for "${title}"! You are #${res.queue_position} in line.`, 'success');
      if (selectedBookDrawer?.id === bookId) setSelectedBookDrawer(null);
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.createBook(form);
      setShowModal(false);
      setForm({ isbn: '', title: '', author: '', genre: '', copies: 1, cover_color: '#d4af37', cover_image: '' });
      addToast(`"${form.title}" added to catalog`, 'success');
      load();
    } catch (e) {
      setFormError(e.message);
      addToast(e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its copy records?`)) return;
    try {
      await api.deleteBook(id);
      addToast(`"${title}" deleted`, 'success');
      if (selectedBookDrawer?.id === id) setSelectedBookDrawer(null);
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const genres = ['All', ...new Set(books.map((b) => b.genre).filter(Boolean))];
  const filteredBooks = selectedGenre === 'All'
    ? books
    : books.filter((b) => b.genre?.toLowerCase() === selectedGenre.toLowerCase());

  return (
    <div className="animate-in">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Physical Book Catalog</h1>
          <p className="subtitle">
            {isStudent
              ? 'Browse campus library titles with high-definition covers and 1-click checkout'
              : 'Manage physical book stock, copy inventories, and circulation availability'}
          </p>
        </div>

        {!isStudent && (
          <button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add New Title
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="search-toolbar">
        <form className="search-box-wrapper" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, author, genre, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            type="button"
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="3D Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
            title="List Table View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Genre Filter Chips */}
      {genres.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={selectedGenre === g ? 'btn' : 'secondary'}
              style={{ padding: '5px 14px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton Loading Shimmer */}
      {loading && (
        <div className="books-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && filteredBooks.length === 0 && (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <p>No titles found matching your search criteria.</p>
        </div>
      )}

      {/* 3D Visual Grid View */}
      {!loading && !error && filteredBooks.length > 0 && viewMode === 'grid' && (
        <div className="books-grid">
          {filteredBooks.map((b) => {
            const hasCover = !!b.cover_image;
            return (
              <div
                key={b.id}
                className="book-card-3d"
                onClick={() => setSelectedBookDrawer(b)}
              >
                {/* Book Cover Image Container */}
                <div className="book-cover-container">
                  {hasCover ? (
                    <img src={b.cover_image} alt={b.title} className="book-cover-img" />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, ${b.cover_color || '#161a22'} 0%, #0a0c10 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <BookOpen size={48} />
                    </div>
                  )}

                  <div className="book-cover-gradient-overlay" />

                  <span className={`badge book-cover-badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {b.available_copies > 0 ? `${b.available_copies} Available` : 'Reserved Queue'}
                  </span>
                </div>

                {/* Book Card Body */}
                <div className="book-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="book-genre-tag">{b.genre || 'General'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{b.id}
                    </span>
                  </div>

                  <h3 className="book-card-title" title={b.title} style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                    {b.title}
                  </h3>
                  <p className="book-card-author" style={{ marginBottom: 14 }}>
                    by {b.author}
                  </p>

                  <div className="book-card-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {isStudent ? (
                      b.available_copies > 0 ? (
                        <button
                          className="btn"
                          style={{ padding: '7px 14px', fontSize: '0.8rem', width: '100%' }}
                          onClick={(e) => { e.stopPropagation(); handleStudentBorrow(b.id, b.title); }}
                        >
                          <CalendarClock size={14} /> Reserve / Pickup
                        </button>
                      ) : (
                        <button
                          className="secondary"
                          style={{ padding: '7px 14px', fontSize: '0.8rem', width: '100%' }}
                          onClick={(e) => { e.stopPropagation(); handleStudentReserve(b.id, b.title); }}
                        >
                          <CalendarClock size={14} /> Reserve Copy
                        </button>
                      )
                    ) : (
                      <>
                        <span className="book-copies-indicator" style={{ fontSize: '0.78rem' }}>
                          <Tag size={13} /> {b.copy_count} {b.copy_count === 1 ? 'copy' : 'copies'}
                        </span>
                        <button
                          className="ghost"
                          style={{ color: 'var(--danger)', padding: '6px' }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(b.id, b.title); }}
                          title="Delete Book"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!loading && !error && filteredBooks.length > 0 && viewMode === 'table' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Author</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Available</th>
                {!isStudent && <th>Total Copies</th>}
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((b) => (
                <tr key={b.id} onClick={() => setSelectedBookDrawer(b)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="td-title">
                      {b.cover_image ? (
                        <img
                          src={b.cover_image}
                          alt={b.title}
                          style={{ width: 34, height: 46, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <span
                          className="book-spine-dot"
                          style={{ backgroundColor: b.cover_color || 'var(--primary)' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          by {b.author}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td-id">{b.isbn}</td>
                  <td>
                    <span className="book-genre-tag">{b.genre || '—'}</span>
                  </td>
                  <td>
                    <span className={`badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {b.available_copies} / {b.copy_count}
                    </span>
                  </td>
                  {!isStudent && <td>{b.copy_count}</td>}
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      {isStudent ? (
                        b.available_copies > 0 ? (
                          <button
                            className="btn"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={(e) => { e.stopPropagation(); handleStudentBorrow(b.id, b.title); }}
                          >
                            <CalendarClock size={13} /> Reserve
                          </button>
                        ) : (
                          <button
                            className="secondary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={(e) => { e.stopPropagation(); handleStudentReserve(b.id, b.title); }}
                          >
                            <CalendarClock size={13} /> Reserve
                          </button>
                        )
                      ) : (
                        <button
                          className="danger"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(b.id, b.title); }}
                        >
                          <Trash2 size={13} /> Delete
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

      {/* Slide-out Side Drawer Details Sheet */}
      {selectedBookDrawer && (
        <div className="drawer-overlay" onClick={() => setSelectedBookDrawer(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookMarked size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Book Details & Stock</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedBookDrawer(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Cover Header */}
              {selectedBookDrawer.cover_image && (
                <div style={{ width: '100%', height: 260, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)' }}>
                  <img src={selectedBookDrawer.cover_image} alt={selectedBookDrawer.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="book-genre-tag">{selectedBookDrawer.genre || 'General'}</span>
                <span className={`badge ${selectedBookDrawer.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {selectedBookDrawer.available_copies > 0 ? `${selectedBookDrawer.available_copies} Available` : '0 Available (Queue Active)'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.45rem', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                {selectedBookDrawer.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                by <strong>{selectedBookDrawer.author}</strong>
              </p>

              <div className="profile-grid" style={{ marginBottom: 24 }}>
                <div className="profile-item">
                  <span className="profile-item-label">ISBN</span>
                  <span className="profile-item-value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedBookDrawer.isbn}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-item-label">Total Copies</span>
                  <span className="profile-item-value">{selectedBookDrawer.copy_count} physical copies</span>
                </div>
                <div className="profile-item">
                  <span className="profile-item-label">Hold Policy</span>
                  <span className="profile-item-value">3-Day Pickup Window</span>
                </div>
                <div className="profile-item">
                  <span className="profile-item-label">Max Loan Period</span>
                  <span className="profile-item-value">14 Days (+2 Renews)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isStudent ? (
                  selectedBookDrawer.available_copies > 0 ? (
                    <button
                      style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                      onClick={() => handleStudentBorrow(selectedBookDrawer.id, selectedBookDrawer.title)}
                    >
                      <CalendarClock size={16} /> Reserve / Request Pickup
                    </button>
                  ) : (
                    <button
                      className="secondary"
                      style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                      onClick={() => handleStudentReserve(selectedBookDrawer.id, selectedBookDrawer.title)}
                    >
                      <CalendarClock size={16} /> Place Hold / Join Waitlist
                    </button>
                  )
                ) : (
                  <button
                    className="danger"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => handleDelete(selectedBookDrawer.id, selectedBookDrawer.title)}
                  >
                    <Trash2 size={16} /> Delete Title from Catalog
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal Dialog */}
      {!isStudent && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add New Title to Catalog</h2>
                <p className="subtitle">Register a book with ISBN, copy count, and optional cover image URL</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <p className="error">{formError}</p>}

            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ISBN Number</label>
                  <input
                    required
                    placeholder="e.g. 978-0132350884"
                    value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Book Title</label>
                  <input
                    required
                    placeholder="e.g. Clean Code"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <input
                    required
                    placeholder="e.g. Robert C. Martin"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Genre / Category</label>
                  <input
                    placeholder="e.g. Computer Science"
                    value={form.genre}
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Number of Physical Copies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.copies}
                    onChange={(e) => setForm({ ...form, copies: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label>Cover Image URL (Optional)</label>
                  <input
                    placeholder="https://images.unsplash.com/..."
                    value={form.cover_image}
                    onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}