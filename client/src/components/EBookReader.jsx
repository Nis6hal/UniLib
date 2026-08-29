import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import PdfViewer from './PdfViewer';
import {
  BookOpenCheck,
  BookOpen,
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
  Bot,
  ChevronLeft,
  ChevronRight,
  List,
  Clock,
  RotateCcw,
  Type,
  ArrowUp
} from 'lucide-react';

export default function EBookReader({ currentUser, initialBook }) {
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'folder'
  const [uploadScopeFilter, setUploadScopeFilter] = useState('all'); // 'all' | 'institutional' | 'personal'

  // Currently Reading shelf
  const [currentlyReading, setCurrentlyReading] = useState([]);

  // RAG Study Assistant & In-Reader Notes State
  const [showRagPanel, setShowRagPanel] = useState(true);
  const [ragTab, setRagTab] = useState('ask'); // 'ask' | 'summary' | 'quiz' | 'flashcards' | 'notes'
  const [ragQuery, setRagQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragAnswer, setRagAnswer] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [userQuizAnswers, setUserQuizAnswers] = useState({});
  const [flashcardsData, setFlashcardsData] = useState(null);
  const [activeFlippedCard, setActiveFlippedCard] = useState({});
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
  const [readerViewMode, setReaderViewMode] = useState('document'); // 'document' | 'pdf'
  const [readerTheme, setReaderTheme] = useState('dark'); // 'dark' | 'light' | 'sepia'
  const [readerZoom, setReaderZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const readerWindowRef = useRef(null);

  // True Browser HTML5 Fullscreen Engine
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (readerWindowRef.current?.requestFullscreen) {
        readerWindowRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Compact paginated reading state
  const [bookContent, setBookContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [jumpToPage, setJumpToPage] = useState('');
  const [searchInBook, setSearchInBook] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const readerContentRef = useRef(null);

  useEffect(() => {
    if (initialBook) {
      openReader(initialBook);
    }
  }, [initialBook]);

  const { addToast } = useToast();

  // Load currently reading shelf
  const loadCurrentlyReading = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const data = await api.getCurrentlyReading(currentUser.id);
      setCurrentlyReading(data.currently_reading || []);
    } catch (err) {
      // Silently fail — not critical
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadCurrentlyReading();
  }, [loadCurrentlyReading]);

  // Save reading progress
  const saveProgress = useCallback(async (bookId, page, total) => {
    if (!currentUser?.id || !bookId) return;
    try {
      await api.saveReadingProgress(bookId, {
        user_id: currentUser.id,
        current_page: page,
        total_pages: total,
        progress_pct: Math.round((page / total) * 100)
      });
    } catch (err) {
      // Silently fail — not critical
    }
  }, [currentUser?.id]);

  // Bridge PDF viewer progress back into UniLib (saves reading progress)
  const handlePdfProgress = useCallback((page, total) => {
    setCurrentPage(page);
    setTotalPages(total);
    if (activeReadingBook && currentUser?.id) {
      saveProgress(activeReadingBook.id, page, total);
    }
  }, [activeReadingBook, currentUser?.id, saveProgress]);

  // Navigate to a page with auto-save
  const goToPage = useCallback((page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    if (activeReadingBook) {
      saveProgress(activeReadingBook.id, clamped, totalPages);
    }
    if (readerContentRef.current) {
      readerContentRef.current.scrollTop = 0;
    }
  }, [totalPages, activeReadingBook, saveProgress]);

  // Search within book content
  const handleSearchInBook = useCallback(() => {
    if (!searchInBook.trim() || !bookContent?.pages) {
      setSearchResults([]);
      return;
    }
    const term = searchInBook.toLowerCase();
    const results = [];
    bookContent.pages.forEach(p => {
      if (p.text.toLowerCase().includes(term)) {
        const idx = p.text.toLowerCase().indexOf(term);
        const start = Math.max(0, idx - 40);
        const end = Math.min(p.text.length, idx + term.length + 40);
        results.push({
          page: p.page,
          snippet: '...' + p.text.slice(start, end) + '...'
        });
      }
    });
    setSearchResults(results);
  }, [searchInBook, bookContent]);

  const handleRagAsk = async (e, customMode) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim() && !customMode) return;
    try {
      setRagLoading(true);
      const queryText = ragQuery.trim() || 'Key concepts and architectural summary';
      const mode = customMode || (ragTab === 'summary' ? 'quick_summary' : 'deep_analysis');
      const res = await api.ragAsk({
        query: queryText,
        document_id: activeReadingBook?.id,
        book_title: activeReadingBook?.title || 'this volume',
        mode: mode
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
      setUserQuizAnswers({});
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

  const handleGenerateFlashcards = async () => {
    try {
      setRagLoading(true);
      setActiveFlippedCard({});
      const res = await api.ragFlashcards({
        document_id: activeReadingBook?.id,
        book_title: activeReadingBook?.title || 'this volume'
      });
      setFlashcardsData(res.flashcards);
      addToast('Active-recall study flashcards generated!', 'success');
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

  const parseFile = (f) => {
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
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    return {
      file: f,
      name: f.name,
      title,
      author,
      size: (f.size / (1024 * 1024)).toFixed(2),
      ext: ext.toUpperCase()
    };
  };

  const ACCEPTED_EXT = ['pdf', 'docx', 'epub', 'txt', 'md'];

  const collectFiles = (fileList) => {
    const raw = Array.from(fileList || []);
    const parsed = raw
      .filter((f) => ACCEPTED_EXT.includes((f.name.split('.').pop() || '').toLowerCase()))
      .map(parseFile);
    if (parsed.length === 0) {
      addToast('No supported documents found (.pdf, .docx, .epub, .txt, .md)', 'error');
      return;
    }
    setBatchFiles((prev) => [...prev, ...parsed]);
    addToast(`Added ${parsed.length} document(s) to the import queue`, 'info');
  };

  const handleFolderChange = (e) => {
    collectFiles(e.target.files);
  };

  const handleMultiFileChange = (e) => {
    collectFiles(e.target.files);
  };

  const removeBatchFile = (index) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
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

  const openReader = async (book) => {
    setActiveReadingBook(book);
    setReaderZoom(100);
    setBookContent(null);
    setCurrentPage(1);
    setTotalPages(1);
    setShowToc(false);
    setSearchInBook('');
    setSearchResults([]);

    // Fetch compact content
    setContentLoading(true);
    try {
      const res = await api.getEBookContent(book.id, currentUser?.id);
      if (res.ok && res.content) {
        setBookContent(res.content);
        setTotalPages(res.content.total_pages || 1);
        // Resume from saved progress
        if (res.progress && res.progress.current_page) {
          setCurrentPage(res.progress.current_page);
        }
      }
      if (res.book) {
        setActiveReadingBook((prev) => ({ ...prev, ...res.book }));
      }
    } catch (err) {
      // Content extraction failed — reader will show fallback
      console.warn('Content extraction unavailable:', err.message);
    } finally {
      setContentLoading(false);
    }
  };

  const closeReader = () => {
    // Save progress before closing
    if (activeReadingBook && currentUser?.id) {
      saveProgress(activeReadingBook.id, currentPage, totalPages);
      // Refresh currently reading shelf
      setTimeout(() => loadCurrentlyReading(), 300);
    }
    setActiveReadingBook(null);
    setBookContent(null);
  };

  // Get current page content
  const getCurrentPageContent = () => {
    if (!bookContent?.pages) return null;
    return bookContent.pages.find(p => p.page === currentPage) || bookContent.pages[0] || null;
  };

  // Keyboard navigation in reader
  useEffect(() => {
    if (!activeReadingBook) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'Escape') {
        closeReader();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPage(totalPages);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReadingBook, currentPage, totalPages, goToPage]);

  const progressPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="animate-in">
      {/* Currently Reading Shelf */}
      {currentlyReading.length > 0 && !activeReadingBook && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-main)' }}>Continue Reading</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(212,175,55,0.1)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
              {currentlyReading.length} active
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {currentlyReading.map((item) => {
              const pct = Math.round(item.progress_pct || 0);
              const lastRead = item.last_read_at ? new Date(item.last_read_at + 'Z').toLocaleDateString() : '';
              return (
                <div
                  key={item.book_id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(15,18,28,0.95) 100%)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => openReader({
                    id: item.book_id,
                    title: item.title,
                    author: item.author,
                    genre: item.genre,
                    file_type: item.file_type,
                    file_size: item.file_size,
                    description: item.description
                  })}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Progress bar at bottom */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #f59e0b)', borderRadius: '0 2px 0 0', transition: 'width 0.3s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.9rem', margin: '0 0 4px 0', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.author} • {item.genre || 'Academic'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {pct}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Page {item.current_page} of {item.total_pages} {lastRead && `• ${lastRead}`}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600
                    }}>
                      <RotateCcw size={11} /> Resume
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            // Check if this book is in currently-reading
            const reading = currentlyReading.find(cr => cr.book_id === eb.id);
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

                {/* Reading progress indicator */}
                {reading && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Page {reading.current_page} / {reading.total_pages}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{Math.round(reading.progress_pct)}%</span>
                    </div>
                    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ width: `${reading.progress_pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}

                <div className="book-card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  <button
                    className="btn"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1 }}
                    onClick={() => openReader(eb)}
                  >
                    <Eye size={14} /> {reading ? `Resume (p.${reading.current_page})` : 'Read Now'}
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
                className={uploadMode === 'multiple' ? 'active' : ''}
                onClick={() => setUploadMode('multiple')}
              >
                <Layers size={15} /> Multiple Files
              </button>
              <button
                type="button"
                className={uploadMode === 'folder' ? 'active' : ''}
                onClick={() => setUploadMode('folder')}
              >
                <FolderUp size={15} /> Entire Folder
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
              /* Bulk Upload — Multiple Files or Entire Folder */
              <form onSubmit={handleUploadBatch}>
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label>{uploadMode === 'folder' ? 'Select Folder from Your Computer' : 'Select Multiple Documents'}</label>
                  {uploadMode === 'folder' ? (
                    <input
                      ref={folderInputRef}
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={handleFolderChange}
                    />
                  ) : (
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.epub,.txt,.md"
                      onChange={handleMultiFileChange}
                    />
                  )}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {uploadMode === 'folder'
                      ? 'Automatically detects and indexes all .pdf, .epub, .docx, and .txt files inside the selected directory.'
                      : 'Hold Ctrl / Cmd to pick several files at once. Titles and authors are auto-extracted from file names (e.g. "Author - Title.pdf").'}
                  </p>
                </div>

                {batchFiles.length > 0 && (
                  <div style={{ maxHeight: 240, overflowY: 'auto', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 18 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} /> Ready to Import ({batchFiles.length} files)
                      </span>
                      <button type="button" className="ghost" style={{ fontSize: '0.72rem', color: 'var(--danger)' }} onClick={() => setBatchFiles([])}>
                        Clear all
                      </button>
                    </div>
                    {batchFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '62%' }}>
                          <strong>{f.title}</strong> <span style={{ color: 'var(--text-muted)' }}>by {f.author}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {f.ext} • {f.size} MB
                          </span>
                          <button type="button" className="ghost" style={{ padding: 2, color: 'var(--danger)' }} onClick={() => removeBatchFile(i)} title="Remove">
                            <X size={13} />
                          </button>
                        </div>
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
                    {isUploading ? 'Importing...' : `Import ${batchFiles.length} Book${batchFiles.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* In-Browser Document Reader Overlay */}
      {activeReadingBook && (
        <div className="reader-overlay" onClick={closeReader}>
          <div
            ref={readerWindowRef}
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
                    by {activeReadingBook.author} • {activeReadingBook.genre || 'Academic Volume'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* View Mode Toggle: Formatted Canvas vs Raw Stream */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)', padding: 2, border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className={readerViewMode === 'document' ? 'active' : 'secondary'}
                    style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: 'var(--radius-full)', border: 'none' }}
                    onClick={() => setReaderViewMode('document')}
                    title="Paginated Reader"
                  >
                    <BookOpen size={13} /> Reader
                  </button>
                  <button
                    type="button"
                    className={readerViewMode === 'pdf' ? 'active' : 'secondary'}
                    style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: 'var(--radius-full)', border: 'none' }}
                    onClick={() => setReaderViewMode('pdf')}
                    title="Embedded PDF Frame"
                  >
                    <FileText size={13} /> PDF Frame
                  </button>
                </div>

                {/* Page Navigation (only in document mode) */}
                {readerViewMode === 'document' && bookContent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 8px', border: '1px solid var(--border)' }}>
                    <button type="button" className="ghost" style={{ padding: '4px' }} onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-main)', minWidth: 65, textAlign: 'center' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button type="button" className="ghost" style={{ padding: '4px' }} onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Progress indicator */}
                {readerViewMode === 'document' && bookContent && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>{progressPct}%</span>
                )}

                {/* TOC toggle */}
                {readerViewMode === 'document' && bookContent?.toc?.length > 0 && (
                  <button
                    type="button"
                    className={showToc ? 'active' : 'secondary'}
                    style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                    onClick={() => setShowToc(!showToc)}
                    title="Table of Contents"
                  >
                    <List size={14} />
                  </button>
                )}

                {/* Font size controls */}
                {readerViewMode === 'document' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button type="button" className="ghost" style={{ padding: '4px' }} onClick={() => setFontSize(s => Math.max(12, s - 1))} title="Decrease font">
                      <Type size={12} />
                    </button>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 22, textAlign: 'center' }}>{fontSize}</span>
                    <button type="button" className="ghost" style={{ padding: '4px' }} onClick={() => setFontSize(s => Math.min(24, s + 1))} title="Increase font">
                      <Type size={16} />
                    </button>
                  </div>
                )}

                {/* Theme Selector (hidden in PDF mode — PdfViewer owns theming) */}
                {readerViewMode !== 'pdf' && (
                  <>
                <button
                  type="button"
                  className={readerTheme === 'dark' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('dark')}
                  title="Dark Obsidian Theme"
                >
                  <Moon size={14} />
                </button>
                <button
                  type="button"
                  className={readerTheme === 'sepia' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('sepia')}
                  title="Warm Sepia Theme"
                >
                  <Coffee size={14} />
                </button>
                <button
                  type="button"
                  className={readerTheme === 'light' ? 'active' : 'secondary'}
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => setReaderTheme('light')}
                  title="Light Crisp Theme"
                >
                  <Sun size={14} />
                </button>
                  </>
                )}

                {/* Zoom Controls (hidden in PDF mode — PdfViewer owns zoom) */}
                {readerViewMode !== 'pdf' && (
                  <>
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
                  </>
                )}
                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  className={isFullscreen ? 'active' : 'secondary'}
                  style={{ padding: '6px 8px' }}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter True Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* Close Reader */}
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeReader}
                  title="Close Reader"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reading Progress Bar (thin line under toolbar) */}
            {readerViewMode === 'document' && bookContent && (
              <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.04)' }}>
                <div style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), #f59e0b)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}

            {/* Reader Content Body + Interactive RAG Study Panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* TOC Sidebar */}
              {showToc && bookContent?.toc?.length > 0 && (
                <div style={{
                  width: 220,
                  borderRight: '1px solid var(--border)',
                  background: 'rgba(10,12,16,0.95)',
                  padding: '14px 12px',
                  overflowY: 'auto',
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <List size={14} /> Contents
                  </div>
                  {bookContent.toc.map((entry, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ghost"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        fontSize: '0.74rem',
                        color: currentPage === entry.page ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: currentPage === entry.page ? 600 : 400,
                        borderRadius: 4,
                        background: currentPage === entry.page ? 'rgba(212,175,55,0.08)' : 'transparent',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => goToPage(entry.page)}
                      title={entry.title}
                    >
                      {entry.title}
                    </button>
                  ))}

                  {/* Jump to Page */}
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Jump to Page</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { goToPage(parseInt(jumpToPage) || 1); setJumpToPage(''); } }}
                        style={{ width: '100%', fontSize: '0.74rem', padding: '4px 8px' }}
                        placeholder={`1-${totalPages}`}
                      />
                      <button type="button" className="secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => { goToPage(parseInt(jumpToPage) || 1); setJumpToPage(''); }}>
                        <ArrowUp size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Search in book */}
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Search in Book</label>
                    <input
                      type="text"
                      value={searchInBook}
                      onChange={(e) => setSearchInBook(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchInBook(); }}
                      style={{ width: '100%', fontSize: '0.74rem', padding: '4px 8px' }}
                      placeholder="Find text..."
                    />
                    {searchResults.length > 0 && (
                      <div style={{ marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                        {searchResults.map((r, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="ghost"
                            style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: '0.68rem', padding: '4px 6px', color: 'var(--text-muted)', marginBottom: 2 }}
                            onClick={() => goToPage(r.page)}
                          >
                            <span style={{ color: 'var(--primary)' }}>p.{r.page}</span> {r.snippet}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Viewport */}
              <div
                ref={readerContentRef}
                className="reader-viewport"
                style={{
                  flex: showRagPanel ? '1 1 65%' : '1 1 100%',
                  padding: readerViewMode === 'pdf' ? 0 : 24,
                  overflowY: readerViewMode === 'pdf' ? 'hidden' : 'auto',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'flex 0.3s ease'
                }}
              >
                {readerViewMode === 'pdf' && activeReadingBook.file_type === 'pdf' ? (
                  <PdfViewer
                    fileUrl={api.getEBookFileUrl(activeReadingBook.id)}
                    bookTitle={activeReadingBook.title}
                    initialPage={currentPage}
                    onProgress={handlePdfProgress}
                    onClose={closeReader}
                    onSwitchToDocument={() => setReaderViewMode('document')}
                  />
                ) : contentLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <Spinner message="Extracting and compressing book pages..." />
                  </div>
                ) : bookContent?.pages ? (
                  /* Compact Paginated Reader — Real Extracted Content */
                  <div
                    style={{
                      maxWidth: 820,
                      margin: '0 auto',
                      padding: '36px 44px',
                      background: readerTheme === 'dark' ? '#0d1017' : readerTheme === 'sepia' ? '#fbf0d9' : '#ffffff',
                      color: readerTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.85,
                      boxShadow: 'var(--shadow-md)',
                      minHeight: 500
                    }}
                  >
                    {/* Page header badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {activeReadingBook.genre || 'Academic Document'} • {activeReadingBook.file_type?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Page {currentPage} of {totalPages} • {getCurrentPageContent()?.word_count || 0} words
                      </span>
                    </div>

                    {/* Page title (show book title on page 1) */}
                    {currentPage === 1 && (
                      <>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', marginBottom: 6 }}>
                          {activeReadingBook.title}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                          Authored by <strong>{activeReadingBook.author}</strong> • University Repository
                        </p>
                        <hr style={{ borderColor: readerTheme === 'dark' ? 'var(--border)' : '#ccc', margin: '20px 0' }} />
                      </>
                    )}

                    {/* Actual extracted page text */}
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {getCurrentPageContent()?.text || 'No content available for this page.'}
                    </div>

                    {/* Bottom page navigation */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 40,
                      paddingTop: 20,
                      borderTop: `1px solid ${readerTheme === 'dark' ? 'var(--border)' : '#ddd'}`
                    }}>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Fallback: static summary when content extraction is unavailable */
                  <div
                    style={{
                      maxWidth: 820,
                      margin: '0 auto',
                      padding: '36px 44px',
                      background: readerTheme === 'dark' ? '#0d1017' : readerTheme === 'sepia' ? '#fbf0d9' : '#ffffff',
                      color: readerTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.8,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {activeReadingBook.genre || 'Academic Document'} • {activeReadingBook.file_type?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Institutional Archival Format
                      </span>
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', marginBottom: 6 }}>
                      {activeReadingBook.title}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                      Authored by <strong>{activeReadingBook.author}</strong> • University Repository
                    </p>
                    <hr style={{ borderColor: 'var(--border)', margin: '20px 0' }} />

                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 8 }}>
                        Executive Summary & Subject Overview
                      </h3>
                      <p style={{ margin: 0 }}>
                        {activeReadingBook.description || `Comprehensive university study guide and core instructional textbook for ${activeReadingBook.title}. This volume covers formal mathematical foundations, algorithmic invariants, and production engineering practices.`}
                      </p>
                    </div>

                    <div style={{ background: 'rgba(212,175,55,0.06)', borderLeft: '4px solid var(--primary)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 30 }}>
                      <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>
                        💡 Content Extraction Note
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Full page extraction is unavailable for this document. Use the PDF Frame tab to view the original file, or try downloading the document directly.
                      </span>
                    </div>
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

                {/* Expanded Upgraded RAG Panel */}
                {showRagPanel && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, overflowY: 'auto' }}>
                    {/* RAG Sub-Tabs Navigation */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 14 }}>
                      <button
                        type="button"
                        className={ragTab === 'ask' ? 'btn' : 'secondary'}
                        style={{ padding: '6px 4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={() => setRagTab('ask')}
                      >
                        <Sparkles size={11} /> Deep RAG
                      </button>
                      <button
                        type="button"
                        className={ragTab === 'summary' ? 'btn' : 'secondary'}
                        style={{ padding: '6px 4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={() => setRagTab('summary')}
                      >
                        <Layers size={11} /> Summary
                      </button>
                      <button
                        type="button"
                        className={ragTab === 'flashcards' ? 'btn' : 'secondary'}
                        style={{ padding: '6px 4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={() => setRagTab('flashcards')}
                      >
                        <BookMarked size={11} /> Flashcards
                      </button>
                      <button
                        type="button"
                        className={ragTab === 'quiz' ? 'btn' : 'secondary'}
                        style={{ padding: '6px 4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={() => setRagTab('quiz')}
                      >
                        <FileCode size={11} /> Exam Quiz
                      </button>
                    </div>

                    {/* Tab 1 & Tab 2: Ask RAG Engine / Quick Summary */}
                    {(ragTab === 'ask' || ragTab === 'summary') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        <form onSubmit={(e) => handleRagAsk(e, ragTab === 'summary' ? 'quick_summary' : 'deep_analysis')} style={{ display: 'flex', gap: 8 }}>
                          <input
                            placeholder={ragTab === 'summary' ? "Enter topic for high-yield summary..." : "Ask any deep technical question..."}
                            value={ragQuery}
                            onChange={(e) => setRagQuery(e.target.value)}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }}
                          />
                          <button type="submit" disabled={ragLoading} style={{ padding: '8px 12px' }}>
                            <Bot size={14} />
                          </button>
                        </form>

                        {ragLoading && <Spinner message="Computing BM25 & semantic evidence vectors..." />}

                        {ragAnswer && (
                          <div style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, fontSize: '0.82rem', lineHeight: 1.6 }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={14} /> {ragAnswer.mode === 'quick_summary' ? 'High-Yield Digest' : 'Grounded Academic Analysis'}
                              </span>
                              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                                {Math.round((ragAnswer.confidence || 0.9) * 100)}% Grounded
                              </span>
                            </div>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', color: 'var(--text-main)' }}>
                              {ragAnswer.answer}
                            </p>

                            {ragAnswer.sources && ragAnswer.sources.length > 0 && (
                              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                                  Verified Evidence Citations:
                                </span>
                                {ragAnswer.sources.map((s, idx) => (
                                  <div key={idx} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '6px 8px', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', marginBottom: 2 }}>
                                      <span>Page {s.page}</span>
                                      <span>Relevance: {s.relevance}</span>
                                    </div>
                                    <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{s.excerpt}"</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Active-Recall Study Flashcards */}
                    {ragTab === 'flashcards' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="secondary" onClick={handleGenerateFlashcards} disabled={ragLoading} style={{ padding: '8px 12px' }}>
                          <Sparkles size={14} /> Generate Study Flashcards
                        </button>

                        {ragLoading && <Spinner message="Extracting high-yield concepts..." />}

                        {flashcardsData && flashcardsData.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {flashcardsData.map((card) => {
                              const isFlipped = activeFlippedCard[card.id];
                              return (
                                <div
                                  key={card.id}
                                  onClick={() => setActiveFlippedCard({ ...activeFlippedCard, [card.id]: !isFlipped })}
                                  style={{
                                    background: isFlipped ? '#161d28' : '#12151d',
                                    border: `1px solid ${isFlipped ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                    <span>{card.topic} • Page {card.page}</span>
                                    <span style={{ color: 'var(--primary)' }}>{isFlipped ? '✓ Answer' : '↻ Click to flip'}</span>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: isFlipped ? 400 : 600, color: isFlipped ? 'var(--text-main)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {isFlipped ? card.back : card.front}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Interactive Bloom's Taxonomy Exam Practice Quiz */}
                    {ragTab === 'quiz' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="secondary" onClick={handleGenerateQuiz} disabled={ragLoading} style={{ padding: '8px 12px' }}>
                          <Sparkles size={14} /> Generate 5-Question Exam Quiz
                        </button>

                        {ragLoading && <Spinner message="Synthesizing Bloom's Taxonomy questions..." />}

                        {quizData && quizData.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {quizData.map((q, idx) => {
                              const selectedOpt = userQuizAnswers[idx];
                              const isAnswered = selectedOpt !== undefined;
                              return (
                                <div key={idx} style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>
                                    Q{idx + 1}. {q.question}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {q.options.map((opt, optIdx) => {
                                      const isCorrect = optIdx === q.correct_option_index;
                                      const isSelected = selectedOpt === optIdx;
                                      let optBg = 'rgba(255,255,255,0.03)';
                                      let optBorder = 'rgba(255,255,255,0.08)';
                                      let optColor = 'var(--text-secondary)';

                                      if (isAnswered) {
                                        if (isCorrect) {
                                          optBg = 'rgba(16,185,129,0.12)';
                                          optBorder = 'var(--success)';
                                          optColor = 'var(--success)';
                                        } else if (isSelected) {
                                          optBg = 'rgba(244,63,94,0.12)';
                                          optBorder = 'var(--danger)';
                                          optColor = 'var(--danger)';
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          onClick={() => !isAnswered && setUserQuizAnswers({ ...userQuizAnswers, [idx]: optIdx })}
                                          style={{
                                            textAlign: 'left',
                                            padding: '8px 10px',
                                            borderRadius: 6,
                                            fontSize: '0.74rem',
                                            background: optBg,
                                            border: `1px solid ${optBorder}`,
                                            color: optColor,
                                            cursor: isAnswered ? 'default' : 'pointer'
                                          }}
                                        >
                                          <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {isAnswered && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                                      {q.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 5: Create Persistent Highlight / Study Note */}
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
