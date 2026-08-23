import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  BookOpenCheck,
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  X,
  Search,
  BookMarked,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  FolderUp,
  FileCode,
  CheckCircle2,
  Bot
} from 'lucide-react';

export default function EBookReader({ currentUser }) {
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'folder'
  const [uploadScopeFilter, setUploadScopeFilter] = useState('all'); // 'all' | 'institutional' | 'personal'

  // RAG Study Assistant & In-Reader Notes State
  const [showRagPanel, setShowRagPanel] = useState(true);
  const [ragTab, setRagTab] = useState('ask'); // 'ask' | 'quiz' | 'notes'
  const [ragQuery, setRagQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragAnswer, setRagAnswer] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [newNoteForm, setNewNoteForm] = useState({ page_number: 1, highlighted_text: '', note_text: '', color: '#d4af37' });

  // Filtered eBooks based on selected tab
  const filteredEBooks = ebooks.filter((eb) => {
    if (uploadScopeFilter === 'institutional') {
      return eb.uploader_role === 'admin' || eb.uploader_role === 'librarian' || !eb.user_id;
    }
    if (uploadScopeFilter === 'personal') {
      return currentUser?.id && eb.user_id === currentUser.id;
    }
    return true;
  });

  // Single Upload Form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    genre: 'Computer Science',
    description: '',
    file: null
  });

  // Batch Folder Upload
  const [batchFiles, setBatchFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const folderInputRef = useRef(null);

  // Active Reader state
  const [activeReadingBook, setActiveReadingBook] = useState(null);
  const [readerTheme, setReaderTheme] = useState('dark'); // 'dark' | 'light' | 'sepia'
  const [readerZoom, setReaderZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { addToast } = useToast();

  const handleRagAsk = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    try {
      setRagLoading(true);
      const res = await api.ragAsk({
        query: ragQuery,
        document_id: activeReadingBook?.id,
        book_title: activeReadingBook?.title || 'this volume'
      });
      setRagAnswer(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRagLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setRagLoading(true);
      const res = await api.ragQuiz({
        document_id: activeReadingBook?.id,
        book_title: activeReadingBook?.title || 'this volume'
      });
      setQuizData(res.quiz);
      addToast('5-Question Exam Quiz generated!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRagLoading(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) {
      addToast('Please sign in to save study notes', 'error');
      return;
    }
    try {
      await api.createAnnotation({
        user_id: currentUser.id,
        document_id: activeReadingBook?.id || 1,
        page_number: newNoteForm.page_number,
        highlighted_text: newNoteForm.highlighted_text,
        note_text: newNoteForm.note_text,
        color: newNoteForm.color
      });
      addToast('Study note saved to your Notes Hub!', 'success');
      setNewNoteForm({ page_number: 1, highlighted_text: '', note_text: '', color: '#d4af37' });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  async function load() {
    try {
      setLoading(true);
      const data = await api.getEBooks(search);
      setEbooks(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load digital ebooks', 'error');
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

  const handleSingleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const suggestedTitle = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm({
        ...uploadForm,
        file: file,
        title: uploadForm.title || suggestedTitle,
        author: uploadForm.author || (currentUser ? currentUser.name : 'University Member')
      });
    }
  };

  const handleFolderChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    const validExtensions = ['pdf', 'docx', 'epub', 'txt', 'md'];

    const filtered = rawFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return validExtensions.includes(ext);
    });

    const parsed = filtered.map((f) => {
      const rawName = f.name.replace(/\.[^/.]+$/, '');
      let author = 'University Repository';
      let title = rawName;
      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        author = parts[0].trim();
        title = parts[1].trim();
      } else if (rawName.toLowerCase().includes(' by ')) {
        const idx = rawName.toLowerCase().indexOf(' by ');
        title = rawName.slice(0, idx).trim();
        author = rawName.slice(idx + 4).trim();
      }
      return {
        file: f,
        name: f.name,
        title: title,
        author: author,
        size: (f.size / (1024 * 1024)).toFixed(2),
        ext: f.name.split('.').pop()?.toUpperCase()
      };
    });

    setBatchFiles(parsed);
    if (parsed.length === 0 && rawFiles.length > 0) {
      addToast('No PDF/DOCX/EPUB documents found in selected folder', 'error');
    } else {
      addToast(`Detected ${parsed.length} readable document files`, 'info');
    }
  };

  const handleUploadSingle = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      addToast('Please select a file from your device', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('author', uploadForm.author);
    formData.append('genre', uploadForm.genre);
    formData.append('description', uploadForm.description);
    if (currentUser?.id) {
      formData.append('user_id', currentUser.id);
    }

    try {
      await api.uploadEBook(formData);
      setShowUploadModal(false);
      setUploadForm({ title: '', author: '', genre: 'Computer Science', description: '', file: null });
      addToast('E-Book uploaded to digital shelf successfully!', 'success');
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadBatch = async (e) => {
    e.preventDefault();
    if (batchFiles.length === 0) {
      addToast('Please select a folder containing documents', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    batchFiles.forEach((item) => {
      formData.append('files', item.file);
    });
    if (currentUser?.id) {
      formData.append('user_id', currentUser.id);
    }

    try {
      const res = await api.uploadBatchEBooks(formData);
      setShowUploadModal(false);
      setBatchFiles([]);
      addToast(`Successfully imported ${res.count || batchFiles.length} books from folder!`, 'success');
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEBook = async (id, title) => {
    if (!window.confirm(`Delete digital book "${title}" from the cloud library?`)) return;
    try {
      await api.deleteEBook(id);
      addToast(`"${title}" deleted from e-library`, 'success');
      if (activeReadingBook && activeReadingBook.id === id) {
        setActiveReadingBook(null);
      }
      load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openReader = (book) => {
    setActiveReadingBook(book);
    setReaderZoom(100);
    setIsFullscreen(false);
  };

  return (
    <div className="animate-in">
      {/* Header Banner */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Digital E-Library & Cloud Repository</h1>
          <p className="subtitle">
            Search university digital texts, upload personal research papers/folders, and read directly in-browser
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)}>
          <UploadCloud size={16} /> Upload Book or Folder
        </button>
      </div>

      {/* Search Toolbar & Scope Tabs */}
      <div className="search-toolbar" style={{ marginBottom: 16 }}>
        <form className="search-box-wrapper" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search digital library by title, author, genre, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {/* Origin Scope Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { id: 'all', label: 'All Digital Resources' },
          { id: 'institutional', label: '🏛️ Institutional Repository (Admin & Faculty)' },
          { id: 'personal', label: '📁 My Personal Vault' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={uploadScopeFilter === tab.id ? 'btn' : 'secondary'}
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
            onClick={() => setUploadScopeFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <Spinner message="Loading digital collection..." />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && filteredEBooks.length === 0 && (
        <div className="empty-state">
          <BookOpenCheck className="empty-icon" />
          <p>No digital documents found in this section.</p>
          <button style={{ marginTop: 12 }} onClick={() => setShowUploadModal(true)}>
            <UploadCloud size={16} /> Upload Document or Folder
          </button>
        </div>
      )}

      {/* Digital Books Grid */}
      {!loading && !error && filteredEBooks.length > 0 && (
        <div className="books-grid">
          {filteredEBooks.map((eb) => {
            const isInstitutional = eb.uploader_role === 'admin' || eb.uploader_role === 'librarian' || !eb.user_id;
            return (
              <div key={eb.id} className="book-card">
                <div
                  className="book-card-spine"
                  style={{
                    background: isInstitutional
                      ? 'linear-gradient(180deg, #d4af37, #f59e0b)'
                      : 'linear-gradient(180deg, #38bdf8, #818cf8)'
                  }}
                />
                <div className="book-card-header">
                  <span className="book-genre-tag">{eb.genre || 'Digital'}</span>
                  <span className={`badge ${isInstitutional ? 'badge-warning' : 'badge-info'}`}>
                    {isInstitutional ? '🏛️ College Resource' : '👤 Personal Vault'}
                  </span>
                </div>

                <h3 className="book-card-title" title={eb.title}>
                  {eb.title}
                </h3>
                <p className="book-card-author">by {eb.author}</p>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{eb.file_type?.toUpperCase()} • {((eb.file_size || 0) / 1024).toFixed(0)} KB</span>
                  <span>{eb.uploader_name ? `By ${eb.uploader_name}` : 'Library Staff'}</span>
                </div>

                {eb.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {eb.description}
                  </p>
                )}

                <div className="book-card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  <button
                    className="btn"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1 }}
                    onClick={() => openReader(eb)}
                  >
                    <Eye size={14} /> Read Now
                  </button>

                  <a
                    href={api.getEBookFileUrl(eb.id)}
                    download={eb.file_name}
                    className="btn secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    title="Download Document"
                  >
                    <Download size={14} />
                  </a>

                  {(currentUser?.role === 'admin' || currentUser?.id === eb.user_id) && (
                    <button
                      className="ghost"
                      style={{ color: 'var(--danger)', padding: '6px' }}
                      onClick={() => handleDeleteEBook(eb.id, eb.title)}
                      title="Delete Document"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal (Single File or Entire Folder) */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <h2>Upload to Digital Library</h2>
                <p className="subtitle">Upload personal documents, lecture notes, or an entire folder of books</p>
              </div>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Upload Mode Switcher */}
            <div className="tab-bar" style={{ marginBottom: 18 }}>
              <button
                type="button"
                className={uploadMode === 'single' ? 'active' : ''}
                onClick={() => setUploadMode('single')}
              >
                <FileText size={15} /> Single Document
              </button>
              <button
                type="button"
                className={uploadMode === 'folder' ? 'active' : ''}
                onClick={() => setUploadMode('folder')}
              >
                <FolderUp size={15} /> Select Entire Folder
              </button>
            </div>

            {uploadMode === 'single' ? (
              <form onSubmit={handleUploadSingle}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Select Document File (.pdf, .docx, .epub, .txt)</label>
                    <input
                      required
                      type="file"
                      accept=".pdf,.docx,.epub,.txt,.md"
                      onChange={handleSingleFileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Document / Book Title</label>
                    <input
                      required
                      placeholder="e.g. Operating Systems Principles"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Author / Lecturer</label>
                    <input
                      required
                      placeholder="e.g. Silberschatz"
                      value={uploadForm.author}
                      onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Discipline / Category</label>
                    <input
                      placeholder="e.g. Computer Science"
                      value={uploadForm.genre}
                      onChange={(e) => setUploadForm({ ...uploadForm, genre: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description / Notes</label>
                    <input
                      placeholder="e.g. Course lecture notes and assignments"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isUploading}>
                    <UploadCloud size={15} />
                    {isUploading ? 'Uploading...' : 'Add to Shelf'}
                  </button>
                </div>
              </form>
            ) : (
              /* Entire Folder Upload */
              <form onSubmit={handleUploadBatch}>
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label>Select Folder from Your Computer</label>
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleFolderChange}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Automatically detects and indexes all .pdf, .epub, .docx, and .txt files inside the selected directory.
                  </p>
                </div>

                {batchFiles.length > 0 && (
                  <div style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 18 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Ready to Import ({batchFiles.length} files detected):
                    </div>
                    {batchFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          <strong>{f.title}</strong> <span style={{ color: 'var(--text-muted)' }}>by {f.author}</span>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {f.ext} • {f.size} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isUploading || batchFiles.length === 0}>
                    <FolderUp size={15} />
                    {isUploading ? 'Importing Folder...' : `Import ${batchFiles.length} Books`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* In-Browser Document Reader Overlay */}
      {activeReadingBook && (
        <div className="reader-overlay" onClick={() => setActiveReadingBook(null)}>
          <div
            className={`reader-window ${readerTheme} ${isFullscreen ? 'fullscreen' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="reader-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BookMarked size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                    {activeReadingBook.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    by {activeReadingBook.author} • {activeReadingBook.file_type?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Theme Selector */}
                <button
                  type="button"
                  className={readerTheme === 'dark' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('dark')}
                  title="Dark Obsidian Theme"
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  type="button"
                  className={readerTheme === 'sepia' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('sepia')}
                  title="Warm Sepia Theme"
                >
                  <Coffee size={14} /> Sepia
                </button>
                <button
                  type="button"
                  className={readerTheme === 'light' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('light')}
                  title="Light Crisp Theme"
                >
                  <Sun size={14} /> Light
                </button>

                {/* Zoom Controls */}
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '6px 8px' }}
                  onClick={() => setReaderZoom((z) => Math.max(z - 15, 60))}
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 40, textAlign: 'center' }}>
                  {readerZoom}%
                </span>
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '6px 8px' }}
                  onClick={() => setReaderZoom((z) => Math.min(z + 15, 180))}
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '6px 8px' }}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* Close Reader */}
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setActiveReadingBook(null)}
                  title="Close Reader"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reader Content Body + Interactive RAG Study Panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Document Viewport */}
              <div
                className="reader-viewport"
                style={{
                  flex: showRagPanel ? '1 1 65%' : '1 1 100%',
                  padding: 24,
                  overflowY: 'auto',
                  transition: 'flex 0.3s ease'
                }}
              >
                {activeReadingBook.file_type === 'pdf' ? (
                  <iframe
                    src={api.getEBookFileUrl(activeReadingBook.id)}
                    title={activeReadingBook.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '80vh',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      transform: `scale(${readerZoom / 100})`,
                      transformOrigin: 'top center'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      maxWidth: 820,
                      margin: '0 auto',
                      padding: '30px 40px',
                      background: readerTheme === 'dark' ? '#0d1017' : readerTheme === 'sepia' ? '#fbf0d9' : '#ffffff',
                      color: readerTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: `${1 * (readerZoom / 100)}rem`,
                      lineHeight: 1.8,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                      {activeReadingBook.title}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                      by {activeReadingBook.author} • Academic Volume
                    </p>
                    <hr style={{ borderColor: 'var(--border)', margin: '20px 0' }} />

                    {activeReadingBook.description ? (
                      <p>{activeReadingBook.description}</p>
                    ) : (
                      <p>
                        This document has been loaded into your secure in-browser reader. You can use the RAG AI Study Assistant panel on the right to ask questions about specific chapters, generate practice quiz questions, or save personal highlights and margin notes.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* RAG Study Assistant & Notes Side Dock */}
              <div
                style={{
                  width: showRagPanel ? 380 : 48,
                  borderLeft: '1px solid var(--border)',
                  background: '#0a0c10',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'width 0.3s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Toggle Bar */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#12151d' }}>
                  <button
                    className="ghost"
                    style={{ padding: 4, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}
                    onClick={() => setShowRagPanel(!showRagPanel)}
                  >
                    <Bot size={18} />
                    {showRagPanel && 'RAG Study Assistant'}
                  </button>
                  {showRagPanel && (
                    <button className="modal-close" style={{ padding: 2 }} onClick={() => setShowRagPanel(false)}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Expanded RAG Panel */}
                {showRagPanel && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, overflowY: 'auto' }}>
                    {/* RAG Sub-Tabs */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                      <button
                        type="button"
                        className={ragTab === 'ask' ? 'btn' : 'secondary'}
                        style={{ padding: '4px 10px', fontSize: '0.74rem', flex: 1 }}
                        onClick={() => setRagTab('ask')}
                      >
                        <Sparkles size={12} /> Ask RAG
                      </button>
                      <button
                        type="button"
                        className={ragTab === 'quiz' ? 'btn' : 'secondary'}
                        style={{ padding: '4px 10px', fontSize: '0.74rem', flex: 1 }}
                        onClick={() => setRagTab('quiz')}
                      >
                        <FileCode size={12} /> Exam Quiz
                      </button>
                      <button
                        type="button"
                        className={ragTab === 'notes' ? 'btn' : 'secondary'}
                        style={{ padding: '4px 10px', fontSize: '0.74rem', flex: 1 }}
                        onClick={() => setRagTab('notes')}
                      >
                        <BookMarked size={12} /> Add Note
                      </button>
                    </div>

                    {/* Tab 1: Ask RAG Engine */}
                    {ragTab === 'ask' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        <form onSubmit={handleRagAsk} style={{ display: 'flex', gap: 8 }}>
                          <input
                            placeholder="Ask any question about this book..."
                            value={ragQuery}
                            onChange={(e) => setRagQuery(e.target.value)}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }}
                          />
                          <button type="submit" disabled={ragLoading} style={{ padding: '8px 12px' }}>
                            <Bot size={14} />
                          </button>
                        </form>

                        {ragLoading && <Spinner message="Searching document chunks..." />}

                        {ragAnswer && (
                          <div style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, fontSize: '0.82rem', lineHeight: 1.5 }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Sparkles size={14} /> Grounded Answer:
                            </div>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', color: 'var(--text-main)' }}>
                              {ragAnswer.answer}
                            </p>

                            {ragAnswer.sources && ragAnswer.sources.length > 0 && (
                              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                                  Verified Evidence Chunks:
                                </span>
                                {ragAnswer.sources.map((s, idx) => (
                                  <div key={idx} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                                    • Page {s.page} (Relevance: {s.relevance})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Auto-Generated Exam Practice Quiz */}
                    {ragTab === 'quiz' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="secondary" onClick={handleGenerateQuiz} disabled={ragLoading}>
                          <Sparkles size={14} /> Generate 5-Question Exam Quiz
                        </button>

                        {ragLoading && <Spinner message="Synthesizing exam questions..." />}

                        {quizData && quizData.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {quizData.map((q, idx) => (
                              <div key={idx} style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                                  Q{idx + 1}. {q.question}
                                </div>
                                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 8px', borderRadius: 4, fontSize: '0.75rem', color: 'var(--success)', marginTop: 6 }}>
                                  ✓ <strong>Answer:</strong> {q.options[0]}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  {q.explanation}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Create Persistent Highlight / Study Note */}
                    {ragTab === 'notes' && (
                      <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page Number</label>
                          <input
                            type="number"
                            min="1"
                            value={newNoteForm.page_number}
                            onChange={(e) => setNewNoteForm({ ...newNoteForm, page_number: parseInt(e.target.value) || 1 })}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Highlighted Quote / Concept</label>
                          <textarea
                            rows="2"
                            placeholder="Selected passage from book..."
                            value={newNoteForm.highlighted_text}
                            onChange={(e) => setNewNoteForm({ ...newNoteForm, highlighted_text: e.target.value })}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>My Study Note</label>
                          <textarea
                            rows="3"
                            required
                            placeholder="Personal explanation or exam tip..."
                            value={newNoteForm.note_text}
                            onChange={(e) => setNewNoteForm({ ...newNoteForm, note_text: e.target.value })}
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <button type="submit">
                          <BookMarked size={14} /> Save Note to My Hub
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
