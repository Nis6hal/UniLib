import React, { useState } from 'react';
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
  Sparkle
} from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  // Scene 3 Interactive Search Simulation State
  const [activeQuery, setActiveQuery] = useState('Machine Learning');
  const searchResultsData = {
    'Machine Learning': [
      { type: 'Textbook', title: 'Pattern Recognition and Machine Learning', author: 'Christopher Bishop', tag: 'Physical Copy (Available)' },
      { type: 'Research Paper', title: 'Attention Is All You Need', author: 'Vaswani et al. (NeurIPS)', tag: 'DOI: 10.48550' },
      { type: 'Journal Article', title: 'Deep Residual Learning for Image Recognition', author: 'He et al. (IEEE TPAMI)', tag: 'Vol 42, Issue 3' },
      { type: 'Thesis', title: 'Reinforcement Learning in High-Dimensional State Spaces', author: 'Dept. of CS (2024)', tag: 'Ph.D. Dissertation' }
    ],
    'Database Systems': [
      { type: 'Textbook', title: 'Database System Concepts (7th Edition)', author: 'Silberschatz, Korth, Sudarshan', tag: 'Physical Copy (3 Copies)' },
      { type: 'Research Paper', title: 'A Relational Model of Data for Large Shared Data Banks', author: 'E. F. Codd (ACM)', tag: 'Landmark Paper' },
      { type: 'Study Notes', title: 'B-Tree Indexing & Normalization Cheatsheet', author: 'Prof. Anderson (CS-201)', tag: 'PDF Notes' }
    ],
    'Distributed Systems': [
      { type: 'Textbook', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', tag: 'Physical Copy' },
      { type: 'Research Paper', title: 'Spanner: Google’s Globally-Distributed Database', author: 'Corbett et al. (OSDI)', tag: 'Research Paper' },
      { type: 'Journal Article', title: 'Raft Consensus: In Search of an Understandable Algorithm', author: 'Ongaro & Ousterhout', tag: 'USENIX' }
    ]
  };

  // Scene 7 AI Study Assistant Simulation State
  const [aiActivePrompt, setAiActivePrompt] = useState('Explain simply');
  const aiResponses = {
    'Explain simply': 'Normalization is the process of organizing database tables to eliminate data redundancy and prevent update anomalies. By splitting data into logical relations (1NF, 2NF, 3NF), you ensure that every piece of information is stored in exactly one place.',
    'Create 3 quiz questions': '1. What distinguishes 3NF from BCNF regarding candidate keys?\n2. Why can unnormalized tables cause deletion anomalies?\n3. Explain the difference between partial functional dependency and transitive dependency.',
    'Extract key takeaways': '• 1NF eliminates repeating groups.\n• 2NF removes partial key dependencies.\n• 3NF eliminates transitive dependencies.\n• BCNF enforces that every determinant is a candidate key.'
  };

  // Scene 6 Interactive Knowledge Graph Active Node State
  const [selectedGraphNode, setSelectedGraphNode] = useState('Databases');

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="sidebar-brand-icon" style={{ width: 40, height: 40 }}>
            <Library size={22} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>
            UniLib <span className="badge-mini" style={{ marginLeft: 6 }}>Academic 2.0</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="secondary" onClick={() => onOpenAuth('login')}>
            Sign In
          </button>
          <button onClick={() => onOpenAuth('register')}>
            Explore Library <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge animate-in">
          <Sparkles size={14} color="var(--primary)" />
          <span>The Next-Generation University Knowledge Platform</span>
        </div>

        <h1 className="hero-headline animate-in" style={{ fontSize: '3.6rem' }}>
          Your College Library, <br />
          <span style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f59e0b 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Reimagined for 2026.
          </span>
        </h1>

        <p className="hero-subtext animate-in">
          Discover books, research papers, journals, study materials, and personal digital notes — unified into an intelligent, living academic ecosystem.
        </p>

        <div className="hero-cta-group animate-in">
          <button style={{ padding: '14px 30px', fontSize: '1rem' }} onClick={() => onOpenAuth('register')}>
            <Sparkles size={18} /> Explore Library
          </button>
          <a href="#story-section" className="btn secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            See How It Works <ArrowRight size={16} />
          </a>
        </div>

        {/* Real-Image 3D Floating Hardcover Book & Orbiting Badges */}
        <div className="real-3d-book-container animate-in">
          <div className="hero-glow-halo" />

          {/* Orbiting Metadata Badges */}
          <div className="orbiting-card card-1">
            <BookOpen size={16} color="var(--primary)" /> Physical Stock: 12,000+ Volumes
          </div>
          <div className="orbiting-card card-2">
            <FileCode size={16} color="var(--info)" /> Research DOI & Theses Repository
          </div>
          <div className="orbiting-card card-3">
            <FolderUp size={16} color="var(--success)" /> Personal Study Vault & Folders
          </div>
          <div className="orbiting-card card-4">
            <Bot size={16} color="var(--warning)" /> AI-Grounded Document Assistant
          </div>

          {/* Realistic 3D Book */}
          <div className="real-3d-book" onClick={() => onOpenAuth('register')}>
            {/* Front Cover with Real High-Res Photography Artwork */}
            <div className="book-front-cover">
              <img
                src="https://images.unsplash.com/photo-1532012164546-f432f2e3dd44?w=800&auto=format&fit=crop&q=80"
                alt="Artificial Intelligence: A Modern Approach"
              />
              <div className="book-spine-sheen" />
              <div className="book-cover-foil-overlay">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="badge-mini">Academic Vol. 2026</span>
                  <Sparkles size={13} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', color: '#fff', margin: '4px 0 2px' }}>
                  Artificial Intelligence
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Russell & Norvig • 4th Edition
                </p>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Physical & Digital</span>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Available</span>
                </div>
              </div>
            </div>

            {/* Realistic 3D Paper Edges */}
            <div className="book-side-pages" />
            <div className="book-bottom-pages" />

            {/* Back Hardcover */}
            <div className="book-back-cover" />
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="hero-stats-strip animate-in" style={{ marginTop: 24 }}>
          <div className="hero-stat-item">
            <strong>5 Books</strong>
            <span>Student Quota</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>14 Days</strong>
            <span>Circulation Period</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>PDF / EPUB</strong>
            <span>Bulk Folder Reader</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>MCR</strong>
            <span>Audited Governance</span>
          </div>
        </div>
      </section>

      {/* Infinite Horizontal Sliding Book Carousel */}
      <section style={{ width: '100%', overflow: 'hidden', padding: '20px 0 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)', fontWeight: 700 }}>
            Featured Academic Collection
          </span>
        </div>

        <div className="marquee-container">
          <div className="marquee-track">
            {[
              { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80', genre: 'Fiction' },
              { title: '1984', author: 'George Orwell', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80', genre: 'Dystopian' },
              { title: 'Dune', author: 'Frank Herbert', img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&auto=format&fit=crop&q=80', genre: 'Sci-Fi' },
              { title: 'Sapiens', author: 'Yuval Noah Harari', img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=80', genre: 'History' },
              { title: 'The Martian', author: 'Andy Weir', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80', genre: 'Sci-Fi' },
              { title: 'The Alchemist', author: 'Paulo Coelho', img: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&auto=format&fit=crop&q=80', genre: 'Philosophy' },
              { title: 'Atomic Habits', author: 'James Clear', img: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&auto=format&fit=crop&q=80', genre: 'Productivity' },
              { title: 'The Midnight Library', author: 'Matt Haig', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80', genre: 'Fiction' },
              // Duplicate set for smooth infinite loop
              { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80', genre: 'Fiction' },
              { title: '1984', author: 'George Orwell', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80', genre: 'Dystopian' },
              { title: 'Dune', author: 'Frank Herbert', img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&auto=format&fit=crop&q=80', genre: 'Sci-Fi' },
              { title: 'Sapiens', author: 'Yuval Noah Harari', img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=80', genre: 'History' },
              { title: 'The Martian', author: 'Andy Weir', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80', genre: 'Sci-Fi' },
              { title: 'The Alchemist', author: 'Paulo Coelho', img: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&auto=format&fit=crop&q=80', genre: 'Philosophy' },
              { title: 'Atomic Habits', author: 'James Clear', img: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&auto=format&fit=crop&q=80', genre: 'Productivity' },
              { title: 'The Midnight Library', author: 'Matt Haig', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80', genre: 'Fiction' },
            ].map((book, i) => (
              <div key={i} className="marquee-card" onClick={() => onOpenAuth('login')}>
                <img src={book.img} alt={book.title} />
                <div className="marquee-card-overlay">
                  <span className="badge-mini" style={{ width: 'fit-content', marginBottom: 4 }}>{book.genre}</span>
                  <span className="marquee-card-title">{book.title}</span>
                  <span className="marquee-card-author">by {book.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
         SCROLL STORYTELLING: 8 SCENES (Based on Landingpagedesign.md)
         ========================================================================= */}
      <section id="story-section" className="story-section">
        <div className="story-header">
          <span className="scene-step-pill">The Story of Knowledge</span>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
            From Physical Shelves to a Living Knowledge Graph
          </h2>
          <p className="subtitle" style={{ fontSize: '1.1rem' }}>
            Follow the journey of how UniLib bridges traditional circulation with personal study and institutional research.
          </p>
        </div>

        {/* Scene 1 & 2: The Traditional Library & Digital Transformation */}
        <div className="scene-card-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 01 & 02 • Transformation</span>
              <h3 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
                "Everything your library has. Accessible from anywhere."
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 20 }}>
                Physical shelves, accession numbers, and barcode issue/return cycles seamlessly connect with a cloud-indexed repository of PDFs, lecture notes, EPUBs, research papers, and theses.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> Physical Copies & Waitlist Queue Cascades
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> Digital E-Books, Past Question Papers & Theses
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> Automated Overdue Fine Engine ($0.50/day policy)
                </div>
              </div>
            </div>

            <div style={{ background: '#0a0c10', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>Shelf 4B • Computer Science</span>
                <span className="badge badge-success">3 Copies In Stock</span>
              </div>
              <div className="book-card-3d" style={{ padding: 18, background: '#12151d' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Introduction to Algorithms (CLRS)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Cormen, Leiserson, Rivest, Stein</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-info">Copy #104: Available</span>
                  <span className="badge badge-warning">Copy #105: Due Oct 18</span>
                  <span className="badge badge-info">PDF Edition: Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scene 3: Universal Discovery & Search Simulation */}
        <div className="scene-card-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 24px' }}>
            <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 03 • Universal Discovery</span>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              "One search. Your entire academic knowledge base."
            </h3>
            <p className="subtitle">
              Try clicking a sample topic below to experience how UniLib instantly cross-indexes physical textbooks, journal papers, and student study materials:
            </p>
          </div>

          <div className="search-sim-widget">
            <div className="search-sim-input-row">
              <Search size={18} color="var(--primary)" />
              <input
                type="text"
                readOnly
                value={activeQuery}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', width: '100%', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                {['Machine Learning', 'Database Systems', 'Distributed Systems'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={activeQuery === q ? 'btn' : 'secondary'}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
                    onClick={() => setActiveQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorized Live Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {searchResultsData[activeQuery]?.map((res, i) => (
                <div key={i} style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="badge-mini">{res.type}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>{res.tag}</span>
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{res.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{res.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scene 4: Digital Reader with Highlights & Notes */}
        <div className="scene-card-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 04 • Study & Annotate</span>
              <h3 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
                "Don't just access knowledge. Study it."
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 18 }}>
                Read without distractions directly in your browser. Highlight key theorems, attach personal margin notes, and automatically sync your reading progress across sessions.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-info"><Eye size={12} /> Dark / Sepia / Light</span>
                <span className="badge badge-info"><Sliders size={12} /> Fluid Zoom (60%–180%)</span>
                <span className="badge badge-info"><BookMarked size={12} /> Memory Sync</span>
              </div>
            </div>

            <div className="reader-sim-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>Chapter 4 • Relational Calculus</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page 142 • 68% Read</span>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                In tuple relational calculus, a query is expressed as <span className="reader-sim-highlight">{`{ t | P(t) }`}</span>, where <em>t</em> is a tuple variable and <em>P(t)</em> is a predicate formula.
              </p>

              <div className="reader-sim-sticky-note">
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 2 }}>📝 My Study Note:</strong>
                Remember: Safe expressions guarantee finite results. Must appear on Midterm Exam!
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Every safe calculus expression has an equivalent relational algebra expression, proving Codd’s Theorem.
              </p>
            </div>
          </div>
        </div>

        {/* Scene 5: Personal Student Vault */}
        <div className="scene-card-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div style={{ background: '#0a0c10', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderUp size={16} /> My Private Research Vault
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Operating_Systems_Lecture_Notes.pdf', size: '4.2 MB', tag: 'Private' },
                  { name: 'Distributed_Systems_Midterm_Review.docx', size: '1.8 MB', tag: 'Private' },
                  { name: 'Quantum_Computing_Seminar_Draft.epub', size: '8.4 MB', tag: 'Private' }
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#12151d', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%', fontSize: '0.82rem' }}>
                      {doc.name}
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{doc.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 05 • Personal Library</span>
              <h3 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
                "Your own library, inside the library."
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 18 }}>
                Students can upload entire folders of personal textbooks, course slides, or research papers from their device. Private by default, searchable anywhere, and ready for instant in-browser study.
              </p>
              <button onClick={() => onOpenAuth('register')}>
                <FolderUp size={16} /> Start Your Personal Vault
              </button>
            </div>
          </div>
        </div>

        {/* Scene 6: Interactive Connected Academic Knowledge Graph */}
        <div className="scene-card-container">
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 28px' }}>
            <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 06 • Research Ecosystem</span>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              "Knowledge is connected."
            </h3>
            <p className="subtitle">
              Click any discipline node on the academic network below to explore how textbooks, publications, and student curricula interlink:
            </p>
          </div>

          <div className="knowledge-graph-container">
            {/* SVG Interactive Node Network */}
            <svg width="100%" height="100%" viewBox="0 0 700 300" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Connecting Edges */}
              <line x1="350" y1="50" x2="180" y2="150" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="350" y1="50" x2="350" y2="150" stroke="rgba(212,175,55,0.3)" strokeWidth="2" />
              <line x1="350" y1="50" x2="520" y2="150" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeDasharray="4 4" />

              <line x1="180" y1="150" x2="120" y2="240" stroke="rgba(212,175,55,0.2)" strokeWidth="1.5" />
              <line x1="350" y1="150" x2="350" y2="240" stroke="rgba(212,175,55,0.4)" strokeWidth="2" />
              <line x1="520" y1="150" x2="580" y2="240" stroke="rgba(212,175,55,0.2)" strokeWidth="1.5" />

              {/* Nodes */}
              <g onClick={() => setSelectedGraphNode('Databases')} style={{ cursor: 'pointer' }}>
                <circle cx="350" cy="50" r="32" fill="#161b26" stroke="#d4af37" strokeWidth="2.5" />
                <text x="350" y="55" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">DATABASES</text>
              </g>

              <g onClick={() => setSelectedGraphNode('SQL & Indexing')} style={{ cursor: 'pointer' }}>
                <circle cx="180" cy="150" r="26" fill="#10131a" stroke="#d4af37" strokeWidth="1.5" />
                <text x="180" y="154" fill="#cbd5e1" fontSize="10" textAnchor="middle">SQL & Relational</text>
              </g>

              <g onClick={() => setSelectedGraphNode('Neural Nets & AI')} style={{ cursor: 'pointer' }}>
                <circle cx="350" cy="150" r="28" fill="#10131a" stroke="#d4af37" strokeWidth="2" />
                <text x="350" y="154" fill="#cbd5e1" fontSize="10" fontWeight="600" textAnchor="middle">AI & Embeddings</text>
              </g>

              <g onClick={() => setSelectedGraphNode('Distributed Systems')} style={{ cursor: 'pointer' }}>
                <circle cx="520" cy="150" r="26" fill="#10131a" stroke="#d4af37" strokeWidth="1.5" />
                <text x="520" y="154" fill="#cbd5e1" fontSize="10" textAnchor="middle">Distributed OS</text>
              </g>

              {/* Bottom Resource Leaf Nodes */}
              <g onClick={() => setSelectedGraphNode('Physical Catalog Copies')} style={{ cursor: 'pointer' }}>
                <rect x="70" y="225" width="100" height="32" rx="16" fill="#161b26" stroke="rgba(212,175,55,0.3)" />
                <text x="120" y="245" fill="#d4af37" fontSize="10" textAnchor="middle">📚 Books Catalog</text>
              </g>

              <g onClick={() => setSelectedGraphNode('Verified Student Portfolio')} style={{ cursor: 'pointer' }}>
                <rect x="290" y="225" width="120" height="32" rx="16" fill="#161b26" stroke="#d4af37" />
                <text x="350" y="245" fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">🎓 Student Profile</text>
              </g>

              <g onClick={() => setSelectedGraphNode('Research DOI Papers')} style={{ cursor: 'pointer' }}>
                <rect x="530" y="225" width="100" height="32" rx="16" fill="#161b26" stroke="rgba(212,175,55,0.3)" />
                <text x="580" y="245" fill="#d4af37" fontSize="10" textAnchor="middle">📄 DOI Papers</text>
              </g>
            </svg>
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Active Node Focus: <strong style={{ color: 'var(--primary)' }}>{selectedGraphNode}</strong>
          </div>
        </div>

        {/* Scene 7: AI Document Assistant Interactive Simulation */}
        <div className="scene-card-container">
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 28px' }}>
            <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 07 • Document Intelligence</span>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              "And make knowledge easier to understand."
            </h3>
            <p className="subtitle">
              Simulate asking the AI Assistant questions about database normalization and study materials:
            </p>
          </div>

          <div className="ai-sim-chatbox">
            {/* Interactive Prompt Picker */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {['Explain simply', 'Create 3 quiz questions', 'Extract key takeaways'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={aiActivePrompt === p ? 'btn' : 'secondary'}
                  style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                  onClick={() => setAiActivePrompt(p)}
                >
                  <Sparkles size={13} /> {p}
                </button>
              ))}
            </div>

            <div className="ai-bubble-user">
              {aiActivePrompt === 'Explain simply' && 'Explain database normalization simply.'}
              {aiActivePrompt === 'Create 3 quiz questions' && 'Create 3 exam practice questions from Chapter 4.'}
              {aiActivePrompt === 'Extract key takeaways' && 'Extract the key takeaways for 1NF, 2NF, and 3NF.'}
            </div>

            <div className="ai-bubble-bot">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>
                <Bot size={15} /> UniLib Academic Study Assistant
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>
                {aiResponses[aiActivePrompt]}
              </div>
            </div>
          </div>
        </div>

        {/* Scene 8: Executive Command Center & Governance */}
        <div className="scene-card-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: 12 }}>Scene 08 • Administration</span>
              <h3 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
                "A smarter library for the people who run it."
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 18 }}>
                The command center gives faculty librarians and university directors live intelligence on circulation velocity, on-time compliance rates, inventory health, and fine revenues.
              </p>
              <button className="secondary" onClick={() => onOpenAuth('login')}>
                Sign In as Staff / Administrator
              </button>
            </div>

            <div style={{ background: '#0a0c10', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ background: '#12151d', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-Time Return Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>94.2%</div>
                </div>
                <div style={{ background: '#12151d', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Circulation</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>348 Loans</div>
                </div>
              </div>
              <div style={{ background: '#12151d', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Department Usage Trends</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  Computer Science (44%) • Engineering (28%) • Business (18%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h2>
          <p className="subtitle">Operational policies regarding circulation, digital reader tools, and access control</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              q: 'How does the digital document upload and folder importer work?',
              a: 'Students and faculty can upload individual research papers or select an entire folder of PDF, DOCX, and EPUB files. The system automatically parses authors, titles, and formats, indexing them in your private cloud shelf.'
            },
            {
              q: 'How are due-date notifications dispatched?',
              a: 'Our background notification engine scans active loans and sends automated SMTP email alerts 2 days prior to your due date, as well as instant notifications when your reserved hold is ready for pickup at the circulation desk.'
            },
            {
              q: 'How are administrative permissions granted?',
              a: 'All public registrations default to verified Student status. Elevation to Librarian or System Administrator privileges is securely managed by library administrators via the Member Access Directory.'
            },
            {
              q: 'What formats does the in-browser reader support?',
              a: 'The reader natively renders PDF, EPUB, DOCX, and Markdown documents with customizable viewports including Dark Obsidian, Warm Sepia, and Crisp Light themes alongside zoom controls.'
            }
          ].map((faq, idx) => (
            <div key={idx} className="card" style={{ padding: '20px 24px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.02rem', marginBottom: 8, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={16} color="var(--primary)" /> {faq.q}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingLeft: 26 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1000, margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ padding: '50px 30px', border: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(22,26,34,0.95), rgba(10,12,16,0.95))' }}>
          <h2 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            Bring Your College Library Into the Digital Age.
          </h2>
          <p className="subtitle" style={{ maxWidth: 640, margin: '0 auto 28px', fontSize: '1.05rem' }}>
            Empower students, faculty, and librarians with an integrated platform for discovery, circulation, and digital research.
          </p>
          <button style={{ padding: '14px 36px', fontSize: '1.05rem' }} onClick={() => onOpenAuth('register')}>
            <Sparkles size={18} /> Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          <strong>UniLib</strong> — Integrated College Library Management System
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Academic Release 2026.2 • Deep Obsidian & Gold Edition
        </div>
      </footer>
    </div>
  );
}
