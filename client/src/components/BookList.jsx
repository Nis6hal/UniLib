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
      {/* If a book is selected, render the dedicated Book Detail Page view */}
      {selectedBookDrawer ? (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              className="secondary"
              onClick={() => setSelectedBookDrawer(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <ArrowDownLeft size={16} style={{ transform: 'rotate(45deg)' }} /> Back to Catalog
            </button>

            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
              Book Reference #{selectedBookDrawer.id}
            </span>
          </div>

          <div className="card" style={{ padding: '36px 32px', marginBottom: 30 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 36, alignItems: 'start' }}>
              {/* Cover Column */}
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: '#0a0c10', boxShadow: 'var(--shadow-md)' }}>
                {selectedBookDrawer.cover_image ? (
                  <img
                    src={selectedBookDrawer.cover_image}
                    alt={selectedBookDrawer.title}
                    style={{ width: '100%', height: 'auto', maxHeight: 440, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    height: 360,
                    background: `linear-gradient(135deg, ${selectedBookDrawer.cover_color || '#161a22'} 0%, #0a0c10 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    color: 'var(--primary)'
                  }}>
                    <BookOpen size={64} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No Cover Art Provided</span>
                  </div>
                )}
              </div>

              {/* Information Column */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{selectedBookDrawer.genre || 'General Academic'}</span>
                  <span className={`badge ${selectedBookDrawer.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {selectedBookDrawer.available_copies > 0 ? `${selectedBookDrawer.available_copies} of ${selectedBookDrawer.total_copies} Copies Available` : '0 Copies Available (Hold Queue)'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ISBN: {selectedBookDrawer.isbn}
                  </span>
                </div>

                <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: 8, color: 'var(--text-main)' }}>
                  {selectedBookDrawer.title}
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                  Authored by <strong>{selectedBookDrawer.author}</strong>
                </p>

                <div style={{ background: '#0a0c10', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 28 }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Circulation Rules & Loan Policy
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>• Standard Loan: <strong>14 Days</strong></div>
                    <div>• Allowed Renewals: <strong>Up to 2 Times</strong></div>
                    <div>• Late Overdue Fine: <strong>$0.50 / day</strong></div>
                    <div>• Hold Pickup Window: <strong>3 Days from Ready</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {isStudent ? (
                    selectedBookDrawer.available_copies > 0 ? (
                      <button
                        className="btn"
                        style={{ padding: '14px 32px', fontSize: '1rem' }}
                        onClick={() => handleStudentBorrow(selectedBookDrawer.id, selectedBookDrawer.title)}
                      >
                        <CalendarClock size={18} /> Reserve / Request Campus Pickup
                      </button>
                    ) : (
                      <button
                        className="secondary"
                        style={{ padding: '14px 32px', fontSize: '1rem' }}
                        onClick={() => handleStudentReserve(selectedBookDrawer.id, selectedBookDrawer.title)}
                      >
                        <CalendarClock size={18} /> Place Hold / Join Waitlist
                      </button>
                    )
                  ) : (
                    <button
                      className="danger"
                      style={{ padding: '14px 28px' }}
                      onClick={() => handleDelete(selectedBookDrawer.id, selectedBookDrawer.title)}
                    >
                      <Trash2 size={16} /> Delete Title from Catalog
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Catalog View */
        <>
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
                title="3D Visual Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="Data Table View"
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
                    onClick={() => {
                      setSelectedBookDrawer(b);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                            <button
                              className="secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookDrawer(b);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              Details
                            </button>
                            <button
                              className="danger"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(b.id, b.title); }}
                              title="Delete Title"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List Data Table View */}
          {!loading && !error && filteredBooks.length > 0 && viewMode === 'list' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Author</th>
                    <th>ISBN</th>
                    <th>Genre</th>
                    <th>Available / Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b) => (
                    <tr
                      key={b.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedBookDrawer(b);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <td>
                        <strong>{b.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.author}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{b.isbn}</td>
                      <td>
                        <span className="badge badge-info">{b.genre || 'General'}</span>
                      </td>
                      <td>
                        <span className={`badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {b.available_copies} / {b.total_copies}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                          {isStudent ? (
                            b.available_copies > 0 ? (
                              <button
                                className="btn"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => handleStudentBorrow(b.id, b.title)}
                              >
                                Reserve
                              </button>
                            ) : (
                              <button
                                className="secondary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => handleStudentReserve(b.id, b.title)}
                              >
                                Hold
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
        </>
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