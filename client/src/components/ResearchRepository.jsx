import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  FileCode,
  Search,
  Plus,
  Quote,
  Copy,
  ExternalLink,
  BookOpen,
  X,
  Sparkles,
  Layers,
  GraduationCap,
  Download
} from 'lucide-react';

export default function ResearchRepository({ currentUser }) {
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [citationModalPaper, setCitationModalPaper] = useState(null);
  const [citationData, setCitationData] = useState(null);

  const [form, setForm] = useState({
    title: '',
    authors: '',
    abstract: '',
    doi: '',
    journal: '',
    publication_year: 2024,
    department: 'Computer Science',
    supervisor: ''
  });

  const { addToast } = useToast();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  async function loadPapers() {
    try {
      setLoading(true);
      const data = await api.getResearchPapers(search, selectedDept);
      setPapers(data);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, [selectedDept]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPapers();
  };

  const handleCreatePaper = async (e) => {
    e.preventDefault();
    try {
      await api.createResearchPaper(form);
      addToast('Research paper registered in repository!', 'success');
      setShowAddModal(false);
      setForm({ title: '', authors: '', abstract: '', doi: '', journal: '', publication_year: 2024, department: 'Computer Science', supervisor: '' });
      loadPapers();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleOpenCitation = async (paper) => {
    setCitationModalPaper(paper);
    try {
      const res = await api.citeResearchPaper(paper.id);
      setCitationData(res.citations);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const copyToClipboard = (text, formatName) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${formatName} citation to clipboard!`, 'success');
  };

  const departments = ['All', 'Computer Science', 'Engineering', 'Mathematics', 'Business', 'Physics'];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Scholarly Research & Theses Repository</h1>
          <p className="subtitle">
            Peer-reviewed papers, faculty publications, dissertations, and capstone theses with DOI indexing
          </p>
        </div>

        {isStaff && (
          <button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Paper / Thesis
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="search-toolbar" style={{ marginBottom: 16 }}>
        <form className="search-box-wrapper" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, authors, abstract, or DOI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {/* Department Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {departments.map((d) => (
          <button
            key={d}
            type="button"
            className={selectedDept === d ? 'btn' : 'secondary'}
            style={{ padding: '5px 14px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
            onClick={() => setSelectedDept(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {loading && <Spinner message="Loading academic publications..." />}

      {!loading && papers.length === 0 && (
        <div className="empty-state">
          <FileCode className="empty-icon" />
          <p>No research papers found in this discipline.</p>
        </div>
      )}

      {/* Papers Grid */}
      {!loading && papers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {papers.map((p) => (
            <div key={p.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{p.department || 'Scholarly'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.journal || 'Academic Repository'} • {p.publication_year}
                  </span>
                </div>

                {p.doi && (
                  <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    DOI: {p.doi}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: '6px 0 4px', color: '#fff' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--primary)', marginBottom: 12 }}>
                Authors: <strong>{p.authors}</strong> {p.supervisor && `• Supervisor: ${p.supervisor}`}
              </p>

              {p.abstract && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, background: '#0a0c10', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
                    Abstract
                  </strong>
                  {p.abstract}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  🏛️ Institutional Citation Count: <strong>{p.citations_count || 0}</strong>
                </span>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleOpenCitation(p)}>
                    <Quote size={14} /> Cite Paper
                  </button>
                  {p.doi && (
                    <a
                      href={`https://doi.org/${p.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={14} /> DOI Portal
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Citation Modal */}
      {citationModalPaper && (
        <div className="modal-overlay" onClick={() => setCitationModalPaper(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div>
                <h2>Cite This Publication</h2>
                <p className="subtitle">{citationModalPaper.title}</p>
              </div>
              <button className="modal-close" onClick={() => setCitationModalPaper(null)}><X size={18} /></button>
            </div>

            {citationData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                {/* APA */}
                <div style={{ background: '#0a0c10', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>APA 7th Edition</span>
                    <button className="ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => copyToClipboard(citationData.apa, 'APA')}>
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                    {citationData.apa}
                  </p>
                </div>

                {/* IEEE */}
                <div style={{ background: '#0a0c10', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>IEEE Format</span>
                    <button className="ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => copyToClipboard(citationData.ieee, 'IEEE')}>
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                    {citationData.ieee}
                  </p>
                </div>

                {/* BibTeX */}
                <div style={{ background: '#0a0c10', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>BibTeX</span>
                    <button className="ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => copyToClipboard(citationData.bibtex, 'BibTeX')}>
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                    {citationData.bibtex}
                  </pre>
                </div>
              </div>
            ) : (
              <Spinner message="Generating citations..." />
            )}
          </div>
        </div>
      )}

      {/* Add Paper Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Register Scholarly Publication</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePaper}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Paper / Thesis Title</label>
                  <input required placeholder="e.g. Distributed Consensus in Asynchronous Networks" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Authors</label>
                  <input required placeholder="e.g. Elena Rostova, Marcus Thorne" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input required placeholder="e.g. Computer Science" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>DOI Number (Optional)</label>
                  <input placeholder="e.g. 10.1145/2491245.2491247" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Journal / Conference / Degree</label>
                  <input placeholder="e.g. ACM TOCS / Master's Thesis" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Publication Year</label>
                  <input type="number" min="1900" max="2099" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: parseInt(e.target.value) || 2024 })} />
                </div>
                <div className="form-group">
                  <label>Faculty Supervisor (if Thesis)</label>
                  <input placeholder="e.g. Dr. Alan Turing" value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Abstract</label>
                  <textarea rows="3" placeholder="Summary of research methodology and findings..." value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Register Paper</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
