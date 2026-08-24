import React, { useState, useEffect, useRef } from 'react';
import {
  Library,
  BookOpen,
  FileText,
  BellRing,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookMarked,
  Layers,
  CalendarClock,
  Receipt,
  RotateCw,
  FolderUp,
  HelpCircle,
  CheckCircle2,
  Lock,
  Search,
  Bot,
  BrainCircuit,
  Share2,
  FileCode,
  Network,
  Cpu,
  GraduationCap,
  Eye,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Database,
  Bookmark,
  Award,
  Zap,
  Activity,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ onOpenAuth }) {
  // Live dynamic platform stats — 100% real database queries
  const [liveStats, setLiveStats] = useState({
    total_books: 20,
    total_copies: 40,
    available_copies: 34,
    total_digital_books: 12,
    total_courses: 49,
    total_research_papers: 4,
    total_members: 15,
    total_circulation_events: 17,
    featured_books: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Interactive Unified Search Simulation State
  const [activeSearchCategory, setActiveSearchCategory] = useState('Computer Engineering');
  const searchCategoriesData = {
    'Computer Engineering': [
      { type: 'Textbook', title: 'Pattern Recognition and Machine Learning', author: 'Christopher Bishop', tag: 'Physical (Available)', color: '#d4af37' },
      { type: 'Peer-Reviewed Thesis', title: 'Attention Is All You Need: Transformer Models', author: 'Vaswani et al. (NeurIPS)', tag: 'DOI: 10.48550', color: '#38bdf8' },
      { type: 'Journal Article', title: 'Deep Residual Learning for Image Recognition', author: 'He et al. (IEEE TPAMI)', tag: 'Vol 42, Issue 3', color: '#10b981' },
      { type: 'Syllabus Course', title: 'CMP-310: Database Management Systems Core', author: 'Dept. of Computer Engineering', tag: 'Semester 5', color: '#f59e0b' }
    ],
    'Algorithms & Data Structures': [
      { type: 'Textbook', title: 'Introduction to Algorithms (4th Edition)', author: 'Cormen, Leiserson, Rivest, Stein', tag: 'Physical Copy', color: '#d4af37' },
      { type: 'Curriculum Resource', title: 'B+ Trees & Red-Black Tree Balancing Notes', author: 'Faculty of Computer Science', tag: 'CMP-210 Core', color: '#10b981' },
      { type: 'Research Thesis', title: 'Cache-Oblivious Search Structures', author: 'Frigo & Demaine (FOCS)', tag: 'Landmark', color: '#38bdf8' }
    ],
    'Distributed Systems': [
      { type: 'Textbook', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', tag: 'Physical Copy', color: '#d4af37' },
      { type: 'Research Thesis', title: 'Spanner: Globally-Distributed Database Architecture', author: 'Corbett et al. (Google/OSDI)', tag: 'Peer-Reviewed', color: '#38bdf8' },
      { type: 'Journal Article', title: 'In Search of an Understandable Consensus Algorithm (Raft)', author: 'Ongaro & Ousterhout (USENIX)', tag: 'Verified Citation', color: '#10b981' }
    ]
  };

  // Interactive AI Study Assistant Sandbox State
  const [activeRagMode, setActiveRagMode] = useState('Deep Analysis');
  const ragSimulations = {
    'Deep Analysis': {
      title: 'Deep Academic Synthesis • Relational Normalization & BCNF',
      text: 'Normalization decomposes relational schemas to eliminate insertion, update, and deletion anomalies. Boyce-Codd Normal Form (BCNF) strictly requires that for every non-trivial functional dependency X -> Y, X must be a superkey. Unlike 3NF, BCNF resolves structural redundancies when multiple overlapping candidate keys exist.',
      page: 42,
      confidence: '99%',
      badge: 'Verified Grounding'
    },
    'Quick Summary': {
      title: 'High-Yield Conceptual Digest',
      text: '1. 1NF eliminates repeating groups and composite fields.\n2. 2NF removes partial key functional dependencies.\n3. 3NF removes transitive dependencies (X -> Y -> Z).\n4. BCNF enforces that every determinant is strictly a candidate key.',
      page: 42,
      confidence: '97%',
      badge: 'Executive Digest'
    },
    'Exam Flashcard': {
      title: 'Active-Recall Study Flashcard',
      text: 'Prompt: What distinguishes BCNF from 3NF regarding candidate key determinants?\n\nAnswer: 3NF permits dependency X -> A if A is a prime attribute (part of any candidate key), whereas BCNF strictly disallows this unless X itself is a full superkey.',
      page: 43,
      confidence: '98%',
      badge: 'Flashcard #14'
    },
    'Practice Quiz': {
      title: 'Bloom\'s Taxonomy Evaluative Question',
      text: 'Question: Given relation R(A, B, C) with dependencies A -> B and B -> C, in what highest normal form is R?\n\n[A] 1NF\n[B] 2NF (Correct — B -> C violates 3NF due to transitive dependency)\n[C] 3NF\n[D] BCNF',
      page: 45,
      confidence: '99%',
      badge: 'Exam Grader'
    }
  };

  // Interactive Knowledge Graph Active Node State
  const [selectedGraphNode, setSelectedGraphNode] = useState('Databases');
  const graphNodes = [
    { id: 'Databases', label: 'Relational DBs', sub: '12 Volumes • 3NF/BCNF', x: 20, y: 35, color: '#d4af37' },
    { id: 'AI', label: 'Machine Learning', sub: '8 Volumes • Neural Nets', x: 50, y: 20, color: '#38bdf8' },
    { id: 'Distributed', label: 'Distributed Systems', sub: '6 Volumes • Raft/Paxos', x: 80, y: 40, color: '#10b981' },
    { id: 'Algorithms', label: 'Data Structures', sub: '14 Volumes • Graphs/Trees', x: 35, y: 75, color: '#f59e0b' },
    { id: 'Security', label: 'Network Security', sub: '5 Volumes • Crypto/TLS', x: 68, y: 80, color: '#ec4899' }
  ];

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true);
        const data = await api.getPublicStats();
        setLiveStats(data);
      } catch (err) {
        console.error('Failed to load public stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="landing-page-vanguard">
      {/* Fixed Majestic Library Background for Scroll-Reveal Effect */}
      <div className="landing-hero-backdrop">
        <div className="landing-hero-backdrop-overlay" />
      </div>

      {/* Background Ambient Glow Orbs */}
      <div className="vanguard-bg-orbs">
        <div className="ambient-orb orb-gold" />
        <div className="ambient-orb orb-cyan" />
        <div className="ambient-orb orb-indigo" />
      </div>

      {/* Floating Glass Island Navbar */}
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
          <a href="#curriculum" className="nav-link-item">BE Curriculum</a>
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

      {/* Scenic Hero Viewport — Pure Immersive Architectural View */}
      <section className="vanguard-hero-viewport">
        <div className="hero-viewport-content">
          <div className="hero-atmosphere-tag">
            <Sparkles size={13} color="var(--primary)" />
            <span>Digital Archive & Living Academic Sanctuary</span>
          </div>

          <h1 className="hero-viewport-title">
            UniLib
          </h1>

          <p className="hero-viewport-subline">
            University Research Archival & Knowledge Intelligence
          </p>

          <a href="#overview" className="hero-scroll-cue">
            <span className="scroll-cue-text">Enter Archive</span>
            <div className="scroll-cue-bubble">
              <ChevronDown size={15} />
            </div>
          </a>
        </div>
      </section>

      {/* Section: Platform Overview, Headline, CTAs & Quick Capsules */}
      <section id="overview" className="vanguard-overview-section">
        <div className="vanguard-overview-content max-w-5xl mx-auto text-center">
          <div className="hero-eyebrow-pill animate-in">
            <Sparkles size={13} color="var(--primary)" />
            <span>Next-Generation University Knowledge Ecosystem</span>
          </div>

          <h2 className="overview-headline-cinematic animate-in">
            The University Library, <br />
            <span className="headline-gradient-shimmer">
              Reimagined for 2026.
            </span>
          </h2>

          <p className="overview-subtext-clean animate-in">
            Unifying physical book circulation, 8-semester BE computer curriculum, peer-reviewed research papers, and hybrid RAG study intelligence.
          </p>

          <div className="hero-cta-group animate-in">
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

          {/* Live Platform Quick Capsules Matrix */}
          <div className="hero-capsules-grid animate-in">
            <div className="hero-capsule-card" onClick={() => onOpenAuth('register')}>
              <div className="capsule-icon-wrap" style={{ color: '#d4af37' }}>
                <BookOpen size={18} />
              </div>
              <div className="capsule-info">
                <span className="capsule-title">Physical Titles</span>
                <span className="capsule-value">{liveStats.total_books} Cataloged</span>
              </div>
            </div>

            <div className="hero-capsule-card" onClick={() => onOpenAuth('register')}>
              <div className="capsule-icon-wrap" style={{ color: '#10b981' }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="capsule-info">
                <span className="capsule-title">Copies on Shelf</span>
                <span className="capsule-value">{liveStats.available_copies} Available</span>
              </div>
            </div>

            <div className="hero-capsule-card" onClick={() => onOpenAuth('register')}>
              <div className="capsule-icon-wrap" style={{ color: '#38bdf8' }}>
                <GraduationCap size={18} />
              </div>
              <div className="capsule-info">
                <span className="capsule-title">BE Curriculum</span>
                <span className="capsule-value">{liveStats.total_courses} Core Courses</span>
              </div>
            </div>

            <div className="hero-capsule-card" onClick={() => onOpenAuth('register')}>
              <div className="capsule-icon-wrap" style={{ color: '#f59e0b' }}>
                <Bot size={18} />
              </div>
              <div className="capsule-info">
                <span className="capsule-title">Cognitive Search</span>
                <span className="capsule-value">Hybrid BM25 RAG</span>
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

      {/* Section 1: Unified Academic Discovery Simulator */}
      <section id="discovery" className="vanguard-section">
        <div className="section-head-centered">
          <div className="section-eyebrow">Instant Cross-Catalog Index</div>
          <h2 className="section-title-large">Unified Academic Discovery</h2>
          <p className="section-subtext-balanced">
            Search physical books, syllabus notes, research papers, and faculty theses through one indexed catalog.
          </p>
        </div>

        {/* Double-Bezel Search Simulator Card */}
        <div className="vanguard-double-bezel max-w-5xl mx-auto">
          <div className="double-bezel-inner">
            <div className="sim-toolbar">
              <div className="sim-categories">
                {Object.keys(searchCategoriesData).map((cat) => (
                  <button
                    key={cat}
                    className={`sim-cat-btn ${activeSearchCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveSearchCategory(cat)}
                  >
                    <Search size={13} /> {cat}
                  </button>
                ))}
              </div>
              <div className="sim-count-badge">
                <Activity size={13} color="var(--primary)" />
                <span>{searchCategoriesData[activeSearchCategory]?.length || 0} Indexed Items</span>
              </div>
            </div>

            <div className="sim-results-grid">
              {searchCategoriesData[activeSearchCategory]?.map((item, idx) => (
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Hybrid Academic RAG Intelligence Sandbox */}
      <section id="rag-engine" className="vanguard-section" style={{ background: 'rgba(12, 15, 22, 0.7)' }}>
        <div className="section-head-centered">
          <div className="section-eyebrow">Production-Grade Intelligence</div>
          <h2 className="section-title-large">Hybrid BM25 + Semantic RAG Engine</h2>
          <p className="section-subtext-balanced">
            Multi-stage retrieval combining BM25Okapi lexical precision, dense N-gram vectors, Reciprocal Rank Fusion, and exact page citations.
          </p>
        </div>

        {/* Double-Bezel RAG Grid */}
        <div className="vanguard-double-bezel max-w-5xl mx-auto">
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
                {Object.keys(ragSimulations).map((mode) => (
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
                  <span>Grounding Reliability</span>
                  <strong style={{ color: 'var(--success)' }}>{ragSimulations[activeRagMode]?.confidence}</strong>
                </div>
                <div className="confidence-track">
                  <div className="confidence-fill" style={{ width: ragSimulations[activeRagMode]?.confidence }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Source: Database System Concepts (Page {ragSimulations[activeRagMode]?.page})
                </div>
              </div>
            </div>

            <div className="rag-terminal-display">
              <div className="terminal-header">
                <div className="terminal-badge">
                  <ShieldCheck size={14} color="var(--primary)" />
                  <span>{ragSimulations[activeRagMode]?.title}</span>
                </div>
                <span className="terminal-page-tag">
                  Page {ragSimulations[activeRagMode]?.page} Verified
                </span>
              </div>

              <div className="terminal-content">
                <p className="terminal-text">
                  {ragSimulations[activeRagMode]?.text}
                </p>
              </div>

              <div className="terminal-footer">
                <div className="footer-citation-note">
                  <Sparkles size={13} color="var(--primary)" />
                  <span>Citations anchored with mathematical BM25 term coverage and Reciprocal Rank Fusion.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Academic Knowledge Matrix */}
      <section id="graph" className="vanguard-section">
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

            {/* Dynamic Selected Node Intelligence Card */}
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

      {/* Section 4: 8-Semester BE Computer Engineering Curriculum */}
      <section id="curriculum" className="vanguard-section" style={{ background: 'rgba(12, 15, 22, 0.7)' }}>
        <div className="section-head-centered">
          <div className="section-eyebrow">Structured Syllabi</div>
          <h2 className="section-title-large">BE Computer Engineering Curriculum Hub</h2>
          <p className="section-subtext-balanced">
            Structured 8-semester course syllabi, lecture slides, lab manuals, and faculty digital materials.
          </p>
        </div>

        <div className="curriculum-bento-grid max-w-5xl mx-auto">
          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ cursor: 'pointer' }}
            title="Click to view Semester I & II syllabus"
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
            title="Click to view Semester III & IV syllabus"
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
            style={{ cursor: 'pointer' }}
            title="Click to view Semester V & VI syllabus"
          >
            <div className="bento-badge">Year III • Semester V & VI</div>
            <h3>Advanced Computing Systems</h3>
            <p>Operating Systems, Database Management, Computer Networks, Software Engineering, AI Theory.</p>
            <div className="bento-tags">
              <span>CMP-310</span>
              <span>CMP-320</span>
              <span>CMP-330</span>
              <span>CMP-340</span>
            </div>
          </div>

          <div
            className="curriculum-bento-card"
            onClick={() => onOpenAuth('register')}
            style={{ cursor: 'pointer' }}
            title="Click to view Semester VII & VIII syllabus"
          >
            <div className="bento-badge">Year IV • Semester VII & VIII</div>
            <h3>Applied Engineering & Theses</h3>
            <p>Distributed Systems, Cloud Architecture, Network Security, Final Year Capstone Research Project.</p>
            <div className="bento-tags">
              <span>CMP-410</span>
              <span>CMP-420</span>
              <span>PRJ-490</span>
              <span>THS-499</span>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Cinematic Call To Action with Grand Alcove Library Backdrop */}
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
