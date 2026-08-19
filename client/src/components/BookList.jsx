import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ isbn: '', title: '', author: '', genre: '', copies: 1, cover_color: '#6366f1' });
  const [formError, setFormError] = useState('');
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getBooks(search);
      setBooks(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createBook(form);
      setShowForm(false);
      setForm({ isbn: '', title: '', author: '', genre: '', copies: 1, cover_color: '#6366f1' });
      addToast('Book added successfully', 'success');
      load();
    } catch (e) {
      setFormError(e.message);
      addToast(e.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book and all its copies?')) return;
    try {
      await api.deleteBook(id);
      addToast('Book deleted', 'success');
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Books</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Book'}
        </button>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by title, author, genre, or ISBN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {showForm && (
        <form className="form-card animate-in" onSubmit={handleCreate}>
          <h3>Add New Book</h3>
          {formError && <p className="error">{formError}</p>}
          <div className="form-grid">
            <input required placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input required placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <input placeholder="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            <input type="number" min="1" placeholder="Copies" value={form.copies} onChange={(e) => setForm({ ...form, copies: parseInt(e.target.value) || 1 })} />
            <input type="color" value={form.cover_color} onChange={(e) => setForm({ ...form, cover_color: e.target.value })} />
          </div>
          <button type="submit">Add Book</button>
        </form>
      )}

      {loading && <Spinner />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && books.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No books found</p>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Genre</th>
              <th>Available</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: b.cover_color, marginRight: 8, verticalAlign: 'middle' }}></span>
                  {b.title}
                </td>
                <td>{b.author}</td>
                <td className="text-sm text-muted">{b.isbn}</td>
                <td>{b.genre || '—'}</td>
                <td><span className="badge badge-success">{b.available_copies}</span></td>
                <td>{b.copy_count}</td>
                <td>
                  <button className="danger" onClick={() => handleDelete(b.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}