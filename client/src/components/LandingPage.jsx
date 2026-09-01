import React, { useState, useEffect, useRef } from 'react';
import {
  Library,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  GraduationCap,
  Bot,
  ArrowUpRight,
  Search,
  Compass,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Copy,
  Terminal,
  Clock,
  BookMarked
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ onOpenAuth }) {
  // Live dynamic platform stats — real database query
  const [liveStats, setLiveStats] = useState({
    total_books: 20,
    total_copies: 40,
    available_copies: 34,
    total_digital_books: 12,
    total_courses: 49,
    total_research_papers: 4,
    total_members: 15,
    total_circulation_events: 17
  });

  // Interactive Live Search & Category State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Computer Engineering');
  const [liveBooks, setLiveBooks] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Default curated showcase items per category
  const categoryHighlights = {
    'Computer Engineering': [
      { type: 'Textbook', title: 'Pattern Recognition and Machine Learning', author: 'Christopher Bishop', tag: 'Physical Copy • Available', color: '#d4af37' },
      { type: 'Peer-Reviewed Thesis', title: 'Attention Is All You Need: Transformer Architecture', author: 'Vaswani et al. (NeurIPS)', tag: 'DOI: 10.48550', color: '#38bdf8' },
      { type: 'Core Course', title: 'CMP-310: Database Management Systems', author: 'Dept. of Computer Engineering', tag: 'Semester V Syllabus', color: '#10b981' }
    ],
    'Algorithms & Systems': [
      { type: 'Textbook', title: 'Introduction to Algorithms (CLRS 4th Ed.)', author: 'Cormen, Leiserson, Rivest, Stein', tag: 'Hardcover Available', color: '#d4af37' },
      { type: 'Curriculum Resource', title: 'B+ Tree Indexing & Red-Black Balancing Notes', author: 'Faculty of Computer Science', tag: 'CMP-210 Core', color: '#10b981' },
      { type: 'Research Thesis', title: 'Cache-Oblivious Search Structures', author: 'Frigo & Demaine (FOCS)', tag: 'Landmark Thesis', color: '#38bdf8' }
    ],
    'Distributed Cloud': [
      { type: 'Textbook', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', tag: 'Physical Available', color: '#d4af37' },
      { type: 'Research Paper', title: 'Spanner: Google’s Globally Distributed Database', author: 'Corbett et al. (OSDI)', tag: 'Verified Citation', color: '#38bdf8' },
      { type: 'Consensus Study', title: 'In Search of an Understandable Consensus Algorithm (Raft)', author: 'Ongaro & Ousterhout (USENIX)', tag: 'Peer-Reviewed', color: '#10b981' }
    ]
  };

  // Live RAG Simulator Sandbox with Animated Typing Stream Simulation
  const [activeRagMode, setActiveRagMode] = useState('Deep Analysis');
  const [copiedText, setCopiedText] = useState(false);

  const ragScenarios = {
    'Deep Analysis': {
      prompt: 'Synthesize the core distinction between 3NF and BCNF with functional dependencies.',
      response: 'Boyce-Codd Normal Form (BCNF) strictly requires that for every non-trivial functional dependency X -> Y, X must be a superkey.\n\nUnlike 3NF (which permits dependency X -> A if A is a prime attribute belonging to candidate keys), BCNF disallows this. BCNF eliminates anomalies when multiple overlapping composite candidate keys exist.',
      source: 'Silberschatz • Database System Concepts (6th Edition)',
      page: 42,
      confidence: '99.4%',
      latency: '18ms'
    },
    'Quick Digest': {
      prompt: 'Provide an executive 4-bullet digest of Relational Normalization stages.',
      response: '1. 1NF: Atomic attributes; eliminates repeating groups and composite fields.\n2. 2NF: 1NF + eliminates partial key functional dependencies.\n3. 3NF: 2NF + eliminates transitive dependencies (X -> Y -> Z).\n4. BCNF: Every determinant is strictly a candidate superkey.',
      source: 'Dept. of Computer Science • CMP-310 Lecture Decks',
      page: 18,
      confidence: '98.2%',
      latency: '12ms'
    },
    'Exam Flashcard': {
      prompt: 'Generate an active-recall evaluation flashcard for Semester V Database Exam.',
      response: 'PROMPT: Given relation R(A, B, C) with dependencies A -> B and B -> C, identify the highest normal form of R.\n\nANSWER: 2NF. Dependency B -> C represents a transitive dependency on candidate key A, violating 3NF condition.',
      source: 'University Exam Vault • 2024 Past Papers Collection',
      page: 89,
      confidence: '99.1%',
      latency: '15ms'
    },
    'Practice Quiz': {
      prompt: 'Construct a Bloom\'s Taxonomy conceptual multiple-choice question.',
      response: 'QUESTION: In write-ahead logging (WAL), why must the log record reach persistent storage before the corresponding dirty page is flushed to disk?\n\n[A] To minimize memory buffer overhead\n[B] To satisfy the Write-Ahead Logging Invariant for Atomicity and Durability (Correct)\n[C] To prevent lock deadlock contention',
      source: 'Operating Systems & DB Engine Architecture • Chap. 14',
      page: 312,
      confidence: '99.8%',
      latency: '22ms'
    }
  };

  // Interactive Knowledge Matrix Active Node State
  const [selectedGraphNode, setSelectedGraphNode] = useState('Databases');
  const graphNodes = [
    { id: 'Databases', label: 'Relational DBs', sub: '12 Volumes • 3NF/BCNF', x: 20, y: 35, color: '#d4af37' },
    { id: 'AI', label: 'Machine Learning', sub: '8 Volumes • Neural Nets', x: 50, y: 20, color: '#38bdf8' },
    { id: 'Distributed', label: 'Distributed Systems', sub: '6 Volumes • Raft/Paxos', x: 80, y: 40, color: '#10b981' },
    { id: 'Algorithms', label: 'Data Structures', sub: '14 Volumes • Graphs/Trees', x: 35, y: 75, color: '#f59e0b' },
    { id: 'Security', label: 'Network Security', sub: '5 Volumes • Crypto/TLS', x: 68, y: 80, color: '#ec4899' }
  ];

  // Fetch Public Stats on load
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getPublicStats();
        if (data) setLiveStats(data);
      } catch (err) {
        console.error('Failed to load public stats:', err);
      }
    }
    fetchStats();
  }, []);

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveBooks([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const data = await api.getBooks(searchQuery);
        setLiveBooks(data.slice(0, 4));
      } catch (err) {
        console.warn('Search query failed:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopySnippet = () => {
    if (ragScenarios[activeRagMode]) {
      navigator.clipboard.writeText(ragScenarios[activeRagMode].response);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Mouse position tracking for 3D Tilt & Spotlight Glow
  const [tiltStyle, setTiltStyle] = useState({ transform: 'rotateX(0deg) rotateY(0deg)' });

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Set CSS variables for radial spotlight
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    // Calculate 3D tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    });
  };

  const handleCardMouseLeave = (e) => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    });
  };

  return (
    <div className="landing-page-vanguard">
      {/* Fixed Ambient Library Background Layer */}
      <div className="landing-hero-backdrop">
        <div className="landing-hero-backdrop-overlay" />
      </div>

      {/* Background Ambient Glow Orbs */}
      <div className="vanguard-bg-orbs">
        <div className="ambient-orb orb-gold" />
        <div className="ambient-orb orb-cyan" />
        <div className="ambient-orb orb-indigo" />
      </div>

      {/* Floating Island Navigation Bar */}
      <nav className="vanguard-floating-nav">
        <div className="nav-brand-pill">
          <div className="nav-brand-icon">
            <Library size={18} />
          </div>
          <span className="nav-brand-name">UniLib</span>
          <span className="nav-brand-badge">Academic 2.0</span>
        </div>

        <div className="nav-links-island">
          <a href="#discovery" className="nav-link-item">Catalog Discovery</a>
          <a href="#rag-engine" className="nav-link-item">Hybrid RAG</a>
          <a href="#curriculum" className="nav-link-item">Curriculum Hub</a>
          <a href="#graph" className="nav-link-item">Knowledge Matrix</a>
        </div>

        <div className="nav-actions-island">
          <button className="nav-btn-ghost" onClick={() => onOpenAuth('login')}>
            Sign In
          </button>
          <button className="nav-btn-primary" onClick={() => onOpenAuth('register')}>
            <span>Explore Library</span>
            <div className="btn-nested-icon">
              <ArrowUpRight size={14} />
            </div>
          </button>
        </div>
      </nav>

      {/* 1. 50/50 Split Hero Viewport (High Conversion Left + Interactive 3D Showcase Right) */}
      <section className="vanguard-hero-viewport">
        <div className="hero-split-container">
          {/* Left Column: Focused Copy & Value Prop */}
          <div className="hero-left-column">
            <div className="hero-atmosphere-tag">
              <Sparkles size={13} color="var(--primary)" />
              <span>Digital Archive & Living Academic Sanctuary</span>
            </div>

            <h1 className="hero-viewport-title">
              The University Library, <br />
              <span className="headline-gradient-shimmer">Reimagined for 2026.</span>
            </h1>

            <p className="hero-viewport-subline">
              Unifying physical book circulation, 8-semester BE computer curriculum, peer-reviewed research papers, and hybrid RAG study intelligence.
            </p>

            <div className="hero-cta-group">
              <button className="vanguard-cta-primary" onClick={() => onOpenAuth('register')}>
                <span>Access Library Portal</span>
                <div className="btn-nested-icon">
                  <ArrowRight size={16} />
                </div>
              </button>
              <a href="#discovery" className="vanguard-cta-secondary">
                <span>View Live Catalog</span>
                <div className="btn-nested-icon-secondary">
                  <Compass size={15} />
                </div>
              </a>
            </div>

            {/* Quick Metrics Matrix */}
            <div className="hero-capsules-grid">
              <div className="hero-capsule-card spotlight-card" onClick={() => onOpenAuth('register')}>
                <div className="capsule-icon-wrap" style={{ color: '#d4af37' }}>
                  <BookOpen size={18} />
                </div>
                <div className="capsule-info">
                  <span className="capsule-title">Physical Titles</span>
                  <span className="capsule-value">{liveStats.total_books} Cataloged</span>
                </div>
              </div>

              <div className="hero-capsule-card spotlight-card" onClick={() => onOpenAuth('register')}>
                <div className="capsule-icon-wrap" style={{ color: '#10b981' }}>
                  <CheckCircle2 size={18} />
                </div>
                <div className="capsule-info">
                  <span className="capsule-title">On Shelf</span>
                  <span className="capsule-value">{liveStats.available_copies} Ready</span>
                </div>
              </div>

              <div className="hero-capsule-card spotlight-card" onClick={() => onOpenAuth('register')}>
                <div className="capsule-icon-wrap" style={{ color: '#38bdf8' }}>
                  <GraduationCap size={18} />
                </div>
                <div className="capsule-info">
                  <span className="capsule-title">Curriculum</span>
                  <span className="capsule-value">{liveStats.total_courses} BE Courses</span>
                </div>
              </div>

              <div className="hero-capsule-card spotlight-card" onClick={() => onOpenAuth('register')}>
                <div className="capsule-icon-wrap" style={{ color: '#f59e0b' }}>
                  <Bot size={18} />
                </div>
                <div className="capsule-info">
                  <span className="capsule-title">Study AI</span>
                  <span className="capsule-value">Hybrid RAG</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Spotlight Tilt Card */}
          <div className="hero-3d-stage">
            <div
              className="showcase-3d-card spotlight-card"
              style={tiltStyle}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="showcase-float-badge">
                <ShieldCheck size={12} color="var(--success)" /> Verified Archival Grounding
              </div>

              <div className="showcase-book-spine">
                <div className="showcase-cover-art">
                  <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Core Volume</span>
                  <BookMarked size={24} color="#d4af37" />
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)' }}>CMP-310</span>
                </div>
                <div className="showcase-book-meta">
                  <span className="showcase-book-tag">Database Architecture</span>
                  <h4 className="showcase-book-title">Database System Concepts</h4>
                  <p className="showcase-book-author">by Avi Silberschatz & Henry Korth</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> 4 Copies Available on Shelf 3B
                  </span>
                </div>
              </div>

              <div className="showcase-live-snippet">
                <div className="snippet-header">
                  <span>RAG Hybrid Synthesis Preview</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>p. 42 CITED</span>
                </div>
                <p className="snippet-body">
                  "BCNF requires every determinant to be a superkey, completely eliminating structural anomalies when overlapping composite candidate keys exist."
                </p>
              </div>

              <div className="showcase-card-footer">
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>PDF In-Browser</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>AI Notes Hub</span>
                </div>
                <button
                  className="btn"
                  style={{ padding: '4px 12px', fontSize: '0.74rem' }}
                  onClick={() => onOpenAuth('register')}
                >
                  Inspect Book <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Live Campus Metrics Strip */}
      <section className="vanguard-metrics-strip">
        <div className="metrics-strip-shell">
          <div className="metric-cell">
            <div className="metric-number">{liveStats.total_books || '20'}</div>
            <div className="metric-label">Physical Catalog Titles</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-cell">
            <div className="metric-number">{liveStats.available_copies || '34'}</div>
            <div className="metric-label">Available on Shelf</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-cell">
            <div className="metric-number">{liveStats.total_courses || '49'}</div>
            <div className="metric-label">8-Semester BE Courses</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-cell">
            <div className="metric-number">{liveStats.total_research_papers || '4'}</div>
            <div className="metric-label">Peer-Reviewed Theses</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-cell">
            <div className="metric-number">{liveStats.total_members || '15'}</div>
            <div className="metric-label">Registered Scholars</div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Unified Academic Discovery Simulator (With Real DB Live Search) */}
      <section id="discovery" className="vanguard-section">
        <div className="section-head-centered">
          <div className="section-eyebrow">Instant Cross-Catalog Index</div>
          <h2 className="section-title-large">Unified Academic Discovery</h2>
          <p className="section-subtext-balanced">
            Search physical books, syllabus lecture notes, and faculty theses through a single indexed database.
          </p>
        </div>

        <div className="vanguard-double-bezel max-w-5xl mx-auto">
          <div className="double-bezel-inner">
            {/* Live Interactive Search Input */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Search size={18} color="var(--primary)" />
              <input
                type="text"
                placeholder="Try searching 'Operating Systems', 'Machine Learning', or 'Algorithms'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.94rem',
                  width: '100%',
                  fontFamily: 'var(--font-body)'
                }}
              />
              {searchQuery && (
                <button
                  className="ghost"
                  style={{ padding: '2px 8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="sim-toolbar">
              <div className="sim-categories">
                {Object.keys(categoryHighlights).map((cat) => (
                  <button
                    key={cat}
                    className={`sim-cat-btn ${activeCategory === cat && !searchQuery ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSearchQuery('');
                    }}
                  >
                    <BookMarked size={13} /> {cat}
                  </button>
                ))}
              </div>
              <div className="sim-count-badge">
                <Activity size={13} color="var(--primary)" />
                <span>
                  {searchQuery ? `${liveBooks.length} Live Matches` : `${categoryHighlights[activeCategory]?.length} Highlighted Items`}
                </span>
              </div>
            </div>

            {/* Dynamic Results Grid */}
            <div className="sim-results-grid">
              {searchQuery ? (
                loadingSearch ? (
                  <div style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                    Querying live academic catalog...
                  </div>
                ) : liveBooks.length > 0 ? (
                  liveBooks.map((b) => (
                    <div
                      key={b.id}
                      className="sim-result-card"
                      onClick={() => onOpenAuth('register')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="sim-card-top">
                        <span className="sim-type-badge" style={{ borderColor: 'rgba(212,175,55,0.4)', color: 'var(--primary)' }}>
                          {b.genre || 'Academic Volume'}
                        </span>
                        <span className="sim-tag-live">
                          <CheckCircle2 size={12} color="var(--success)" /> {b.available_copies > 0 ? `${b.available_copies} Available` : 'Reserved'}
                        </span>
                      </div>
                      <h4 className="sim-item-title">{b.title}</h4>
                      <p className="sim-item-author">by {b.author}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                    No exact title matches for "{searchQuery}". Showing category archives below.
                  </div>
                )
              ) : (
                categoryHighlights[activeCategory]?.map((item, idx) => (
                  <div
                    key={idx}
                    className="sim-result-card"
                    onClick={() => onOpenAuth('register')}
                    title="Click to view full volume in catalog"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="sim-card-top">
                      <span className="sim-type-badge" style={{ borderColor: `${item.color}40`, color: item.color }}>
                        {item.type}
                      </span>
                      <span className="sim-tag-live">
                        <CheckCircle2 size={12} color="var(--success)" /> {item.tag}
                      </span>
                    </div>
                    <h4 className="sim-item-title">{item.title}</h4>
                    <p className="sim-item-author">by {item.author}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hybrid Academic RAG Intelligence Terminal (Split-Console Architecture) */}
      <section id="rag-engine" className="vanguard-section" style={{ background: 'rgba(12, 15, 22, 0.7)' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          <div>
            <div className="section-eyebrow">Production-Grade Intelligence</div>
            <h2 className="section-title-large" style={{ textAlign: 'left', marginBottom: 12 }}>
              Hybrid BM25 + Semantic RAG Engine
            </h2>
            <p className="section-subtext-balanced" style={{ margin: 0, textAlign: 'left' }}>
              Multi-stage retrieval combining BM25 lexical precision, dense N-gram vectors, Reciprocal Rank Fusion, and exact page citations.
            </p>
          </div>

          <div className="vanguard-double-bezel">
            <div className="double-bezel-inner rag-grid-container">
              <div className="rag-sidebar-modes">
                <div className="rag-sidebar-header">
                  <Bot size={20} color="var(--primary)" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Synthesis Strategies</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-mode study engine</span>
                  </div>
                </div>

                <div className="rag-mode-list">
                  {Object.keys(ragScenarios).map((mode) => (
                    <button
                      key={mode}
                      className={`rag-mode-pill ${activeRagMode === mode ? 'active' : ''}`}
                      onClick={() => setActiveRagMode(mode)}
                    >
                      <Sparkles size={14} color="var(--primary)" />
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>

                <div className="rag-confidence-widget">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                    <span>Grounding Confidence</span>
                    <strong style={{ color: 'var(--success)' }}>{ragScenarios[activeRagMode]?.confidence}</strong>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: ragScenarios[activeRagMode]?.confidence }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Latency: {ragScenarios[activeRagMode]?.latency} • Verified Citation
                  </div>
                </div>
              </div>

              <div className="rag-terminal-display">
                <div className="terminal-header">
                  <div className="terminal-badge">
                    <Terminal size={14} color="var(--primary)" />
                    <span>Query: {ragScenarios[activeRagMode]?.prompt}</span>
                  </div>
                  <button
                    className="ghost"
                    onClick={handleCopySnippet}
                    style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: copiedText ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    <Copy size={12} /> {copiedText ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="terminal-content">
                  <p className="terminal-text">
                    {ragScenarios[activeRagMode]?.response}
                  </p>
                </div>

                <div className="terminal-footer">
                  <div className="footer-citation-note">
                    <ShieldCheck size={14} color="var(--success)" />
                    <span>Grounding: <strong>{ragScenarios[activeRagMode]?.source}</strong> (p. {ragScenarios[activeRagMode]?.page})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Structured Syllabi (Asymmetric Engineering Bento Grid) */}
      <section id="curriculum" className="vanguard-section">
        <div className="section-head-centered">
          <div className="section-eyebrow">Structured Syllabi</div>
          <h2 className="section-title-large">BE Computer Engineering Curriculum Hub</h2>
          <p className="section-subtext-balanced">
            Structured 8-semester course syllabi, lecture slides, lab manuals, and faculty digital materials.
          </p>
        </div>

        <div className="curriculum-bento-grid max-w-5xl mx-auto">
          {/* Featured Hero Bento Card (Year III / Core Systems) */}
          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(15,22,35,0.95) 100%)', border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="bento-badge" style={{ color: 'var(--primary)' }}>Featured • Year III • Semester V & VI</div>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Core Engineering Track</span>
            </div>
            <h3 style={{ fontSize: '1.45rem' }}>Advanced Computing Systems & Data Architecture</h3>
            <p style={{ maxWidth: '780px', marginBottom: 18 }}>
              Operating Systems, Database Management Systems, Computer Networks, Software Engineering, and AI Theory. Complete with verified laboratory manuals and reference textbooks.
            </p>
            <div className="bento-tags">
              <span>CMP-310: Databases</span>
              <span>CMP-320: Operating Systems</span>
              <span>CMP-330: Computer Networks</span>
              <span>CMP-340: Artificial Intelligence</span>
            </div>
          </div>

          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ cursor: 'pointer' }}
          >
            <div className="bento-badge">Year I • Semester I & II</div>
            <h3>Foundational Engineering</h3>
            <p>Calculus, Digital Logic, Programming in C, Basic Electrical, Physics, Engineering Drawing.</p>
            <div className="bento-tags">
              <span>MTH-101</span>
              <span>ELX-112</span>
              <span>CMP-103</span>
              <span>ELE-110</span>
            </div>
          </div>

          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ cursor: 'pointer' }}
          >
            <div className="bento-badge">Year II • Semester III & IV</div>
            <h3>Systems & Algorithmic Core</h3>
            <p>Data Structures, Discrete Mathematics, Microprocessors, Object-Oriented Software Design.</p>
            <div className="bento-tags">
              <span>CMP-210</span>
              <span>MTH-220</span>
              <span>ELX-230</span>
              <span>CMP-240</span>
            </div>
          </div>

          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ gridColumn: '1 / -1', cursor: 'pointer' }}
          >
            <div className="bento-badge">Year IV • Semester VII & VIII</div>
            <h3>Applied Engineering & Final Year Research Thesis</h3>
            <p>Distributed Systems, Cloud Architecture, Network Security, and Final Year Capstone Research Project.</p>
            <div className="bento-tags">
              <span>CMP-410: Distributed Systems</span>
              <span>CMP-420: Cloud Computing</span>
              <span>PRJ-490: Project I</span>
              <span>THS-499: Capstone Thesis</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Academic Knowledge Matrix */}
      <section id="graph" className="vanguard-section" style={{ background: 'rgba(12, 15, 22, 0.7)' }}>
        <div className="section-head-centered">
          <div className="section-eyebrow">Semantic Subject Mesh</div>
          <h2 className="section-title-large">Interactive Academic Knowledge Matrix</h2>
          <p className="section-subtext-balanced">
            Explore interconnected university subject clusters, course prerequisites, and faculty research repositories.
          </p>
        </div>

        <div className="vanguard-double-bezel max-w-5xl mx-auto">
          <div className="double-bezel-inner graph-stage-inner">
            <svg className="graph-svg-canvas" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="20" y1="35" x2="50" y2="20" stroke="rgba(212,175,55,0.25)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <line x1="50" y1="20" x2="80" y2="40" stroke="rgba(56,189,248,0.25)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <line x1="20" y1="35" x2="35" y2="75" stroke="rgba(212,175,55,0.25)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <line x1="35" y1="75" x2="68" y2="80" stroke="rgba(245,158,11,0.25)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <line x1="80" y1="40" x2="68" y2="80" stroke="rgba(16,185,129,0.25)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <line x1="50" y1="20" x2="35" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            </svg>

            <div className="graph-nodes-wrapper">
              {graphNodes.map((node) => (
                <div
                  key={node.id}
                  className={`graph-node-bubble ${selectedGraphNode === node.id ? 'active' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => setSelectedGraphNode(node.id)}
                >
                  <div className="node-dot" style={{ background: node.color }} />
                  <div className="node-label-wrap">
                    <span className="node-title">{node.label}</span>
                    <span className="node-sub">{node.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedGraphNode && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 20,
                right: 20,
                background: 'rgba(10, 14, 22, 0.88)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: graphNodes.find(n => n.id === selectedGraphNode)?.color || 'var(--primary)'
                  }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {graphNodes.find(n => n.id === selectedGraphNode)?.label} Cluster
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                      {graphNodes.find(n => n.id === selectedGraphNode)?.sub}
                    </span>
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ padding: '4px 12px', fontSize: '0.74rem' }}
                  onClick={() => onOpenAuth('register')}
                >
                  Explore Course Materials <ArrowUpRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Grand Alcove Library Call To Action Section */}
      <section className="vanguard-cta-section">
        <div className="cta-backdrop-image-layer">
          <img src="/Unilib.jpg" alt="Grand University Alcove Library" className="cta-library-backdrop-img" />
          <div className="cta-backdrop-overlay" />
        </div>
        <div className="cta-content-shell max-w-3xl mx-auto text-center">
          <div className="cta-eyebrow-pill">
            <Sparkles size={13} color="var(--primary)" />
            <span>Preserving Centuries of Heritage • Powering 2026 Academic Intelligence</span>
          </div>
          <h2 className="cta-headline-epic">
            Experience Higher Learning <br />
            With Living Intelligence.
          </h2>
          <p className="cta-subtext-epic">
            Join scholars, faculty members, and university administrators on UniLib.
          </p>

          <div className="cta-action-row">
            <button className="vanguard-cta-primary" onClick={() => onOpenAuth('register')}>
              <span>Create Scholar Account</span>
              <div className="btn-nested-icon">
                <ArrowRight size={16} />
              </div>
            </button>
            <button className="vanguard-cta-secondary" onClick={() => onOpenAuth('login')}>
              <span>Administrative Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Vanguard Minimalist Footer */}
      <footer className="vanguard-footer">
        <div className="footer-container max-w-6xl mx-auto">
          <div className="footer-brand-side">
            <div className="footer-logo">
              <Library size={20} color="var(--primary)" />
              <span>UniLib</span>
            </div>
            <p className="footer-tagline">
              University Library & Research Archival Management System • Grounded in Real Academic Data.
            </p>
          </div>

          <div className="footer-meta-side">
            <span className="footer-badge-live">
              <span className="live-dot" /> Live Academic Database
            </span>
            <span className="footer-copy">© 2026 UniLib Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
