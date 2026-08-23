import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  BookMarked,
  Search,
  Trash2,
  Copy,
  Printer,
  FileText,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function StudyNotesHub({ currentUser, onOpenReader }) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('All');
  const { addToast } = useToast();

  async function loadNotes() {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const data = await api.getAnnotations(currentUser.id);
      setAnnotations(data);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study note?')) return;
    try {
      await api.deleteAnnotation(id);
      addToast('Note deleted', 'success');
      loadNotes();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied note to clipboard!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueDocs = ['All', ...new Set(annotations.map((a) => a.document_title).filter(Boolean))];

  const filtered = annotations.filter((a) => {
    const matchesSearch =
      (a.highlighted_text && a.highlighted_text.toLowerCase().includes(search.toLowerCase())) ||
      (a.note_text && a.note_text.toLowerCase().includes(search.toLowerCase())) ||
      (a.document_title && a.document_title.toLowerCase().includes(search.toLowerCase()));

    const matchesDoc = selectedDoc === 'All' || a.document_title === selectedDoc;
    return matchesSearch && matchesDoc;
  });

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">My Study Notes & Highlights Hub</h1>
          <p className="subtitle">
            All personal text highlights, margin annotations, and exam notes synchronized across your digital readings
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="secondary" onClick={handlePrint}>
            <Printer size={16} /> Print / Export Revision Sheet
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="search-toolbar" style={{ marginBottom: 20 }}>
        <div className="search-box-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search across your notes, highlighted quotes, or book titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Book Filter Chips */}
      {uniqueDocs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {uniqueDocs.map((doc) => (
            <button
              key={doc}
              type="button"
              className={selectedDoc === doc ? 'btn' : 'secondary'}
              style={{ padding: '5px 14px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
              onClick={() => setSelectedDoc(doc)}
            >
              {doc}
            </button>
          ))}
        </div>
      )}

      {loading && <Spinner message="Loading study notes..." />}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <BookMarked className="empty-icon" />
          <p>No study notes found. Open any book or PDF in the Digital E-Library to highlight text and write margin notes.</p>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map((note) => (
            <div
              key={note.id}
              className="card"
              style={{
                padding: 20,
                borderLeft: `4px solid ${note.color || 'var(--primary)'}`,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Document Reference Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge-mini" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={12} /> Page {note.page_number || 1}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {note.created_at?.slice(0, 10)}
                </span>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 10 }}>
                {note.document_title || 'Academic Resource'}
              </h4>

              {/* Highlighted Excerpt */}
              {note.highlighted_text && (
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.86rem',
                  fontStyle: 'italic',
                  color: 'var(--text-main)',
                  marginBottom: 12,
                  lineHeight: 1.5
                }}>
                  "{note.highlighted_text}"
                </div>
              )}

              {/* Personal Sticky Note */}
              {note.note_text && (
                <div style={{
                  background: '#0a0c10',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 14,
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
                    📝 My Annotation
                  </strong>
                  {note.note_text}
                </div>
              )}

              {/* Footer Actions */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <button
                  className="ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                  onClick={() => handleCopy(note.note_text || note.highlighted_text)}
                >
                  <Copy size={13} /> Copy Quote
                </button>

                <button
                  className="ghost"
                  style={{ color: 'var(--danger)', padding: '4px' }}
                  onClick={() => handleDelete(note.id)}
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
