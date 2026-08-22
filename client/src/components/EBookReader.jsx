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
  CheckCircle2
} from 'lucide-react';

export default function EBookReader({ currentUser }) {
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'folder'
  const [uploadScopeFilter, setUploadScopeFilter] = useState('all'); // 'all' | 'institutional' | 'personal'

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
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '6px 10px', color: 'var(--danger)' }}
                  onClick={() => setActiveReadingBook(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Frame Viewport */}
            <div className="reader-viewport">
              <iframe
                title={activeReadingBook.title}
                src={api.getEBookFileUrl(activeReadingBook.id)}
                className="reader-frame"
                style={{ transform: `scale(${readerZoom / 100})`, transformOrigin: 'top center' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
