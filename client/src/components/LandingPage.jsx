import React, { useState, useEffect, useRef } from 'react';
import {
  Library,
  BookOpen,
  Compass,
  ArrowRight,
  Sparkles,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  GraduationCap,
  Bot,
  Layers,
  ArrowUpRight,
  Search,
  BookMarked,
  Award,
  ExternalLink,
  Calendar,
  Clock,
  LogIn
} from 'lucide-react';
import { api } from '../services/api';
import './AnimatedBookLanding.css';

export default function LandingPage({ onOpenAuth }) {
  // Animation Sequence Stage:
  // 'closed'   -> Closed leather book on dark desk
  // 'opening'  -> Cover hinges open (1.5s)
  // 'expanded' -> Book zooms up to fill viewport frame
  const [animationStage, setAnimationStage] = useState('closed');
  const [currentChapter, setCurrentChapter] = useState(1); // 1 = Hero, 2 = Features, 3 = How It Works, 4 = CTA/Access
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward'); // 'forward' | 'backward'

  // Live database stats
  const [liveStats, setLiveStats] = useState({
    total_books: 20,
    available_copies: 34,
    total_courses: 49,
    total_research_papers: 4,
    total_members: 15
  });

  const canvasRef = useRef(null);

  // Load live platform statistics
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

  // Ambient Dust Motes Canvas Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate dust mote particles
    const motesCount = window.innerWidth < 768 ? 35 : 75;
    const motes = Array.from({ length: motesCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.45 - 0.1,
      opacity: Math.random() * 0.6 + 0.15,
      pulse: Math.random() * Math.PI
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      motes.forEach((m) => {
        m.x += m.speedX;
        m.y += m.speedY;
        m.pulse += 0.02;

        if (m.y < -10) {
          m.y = height + 10;
          m.x = Math.random() * width;
        }
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;

        const currentOpacity = m.opacity + Math.sin(m.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 205, 120, ${Math.max(0, currentOpacity)})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Automatic initial book open & viewport scale sequence
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimationStage('expanded');
      return;
    }

    // Step 1: Closed book loads (1.0s initial pause for awe)
    const t1 = setTimeout(() => {
      setAnimationStage('opening'); // Step 2: Cover hinges open (1.5s)
    }, 1000);

    // Step 3: Scales up to fill viewport frame
    const t2 = setTimeout(() => {
      setAnimationStage('expanded');
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Handle Page Turn Navigation with Authentic Paper Physics Easing (0.8s - 1.2s)
  const turnToChapter = (nextCh) => {
    if (isFlipping || nextCh === currentChapter || nextCh < 1 || nextCh > 4) return;

    setIsFlipping(true);
    setFlipDirection(nextCh > currentChapter ? 'forward' : 'backward');

    // Page flip transition duration ~1050ms
    setTimeout(() => {
      setCurrentChapter(nextCh);
      setIsFlipping(false);
    }, 1050);
  };

  // Keyboard navigation for turning pages
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        turnToChapter(currentChapter + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        turnToChapter(currentChapter - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapter, isFlipping]);

  return (
    <div className="book-stage-viewport">
      {/* Floating Ambient Dust Particles Canvas */}
      <canvas ref={canvasRef} className="dust-motes-canvas" />

      {/* Top Leather-Toned Floating Navbar */}
      <nav className="book-top-nav">
        <div className="book-nav-brand">
          <div className="book-nav-logo">
            <Library size={18} />
          </div>
          <span className="book-nav-title">UniLib</span>
          <span className="book-nav-subtitle">Academic 2.0</span>
        </div>

        <div className="book-nav-actions">
          <button className="book-btn-secondary" onClick={() => onOpenAuth('login')}>
            <LogIn size={14} style={{ display: 'inline', marginRight: 6 }} /> Sign In
          </button>
          <button className="book-btn-primary" onClick={() => onOpenAuth('register')}>
            <span>Access Portal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Main 3D Animated Book Container */}
      <div className={`book-3d-wrapper stage-${animationStage}`}>
        {/* Soft Desk Ambient Drop Shadow */}
        <div className="book-desk-shadow" />

        {/* 1. Closed Leather-Bound Book Cover (Hinges Open on Load) */}
        <div
          className="closed-book-cover"
          onClick={() => {
            if (animationStage === 'closed') {
              setAnimationStage('opening');
              setTimeout(() => setAnimationStage('expanded'), 1500);
            }
          }}
        >
          <div className="cover-spine-edge" />
          <div className="cover-gold-border" />

          <div className="cover-header">
            <div className="cover-institute">Faculty of Computer Engineering</div>
            <div className="cover-crest">
              <BookMarked size={42} />
            </div>
          </div>

          <div className="cover-body">
            <h1 className="cover-title">UNILIB</h1>
            <p className="cover-subtitle">Codex of Higher Learning & Research Repository</p>
          </div>

          <div className="cover-footer">
            <div className="cover-open-cue">
              <Sparkles size={14} color="#d4af37" />
              <span>Click to Open Volume</span>
            </div>
          </div>
        </div>

        {/* 2. The Open Book Spread (Two Parchment Pages with Real Typography) */}
        <div className="open-book-spread">
          <div className="book-spine-crease" />
          <div className="book-ribbon-bookmark" />

          {/* Left Page: Always Contextual Anchor & Chapter Overview */}
          <div className="book-page-leaf left-page">
            <div className="page-running-header">
              <span>UniLib University Codex</span>
              <span>Anno Domini 2026</span>
            </div>

            <div className="page-inner-scroll">
              <div className="chapter-badge">Chapter 0{currentChapter} • Academic Manifesto</div>
              <h2 className="chapter-title-grand">
                {currentChapter === 1 && "Preserving Centuries of Heritage"}
                {currentChapter === 2 && "The Pillars of Intelligence"}
                {currentChapter === 3 && "The Scholar's Pathway"}
                {currentChapter === 4 && "The Gate of Matriculation"}
              </h2>

              <p className="chapter-subhead">
                {currentChapter === 1 && "Where classical architectural grandeur meets computational retrieval."}
                {currentChapter === 2 && "A unified repository for physical circulation, digital texts, and course syllabi."}
                {currentChapter === 3 && "From instant catalogue search to AI-grounded deep synthesis."}
                {currentChapter === 4 && "Join scholars, faculty members, and research engineers."}
              </p>

              <hr className="parchment-divider" />

              {/* Left Page Detail Modules */}
              {currentChapter === 1 && (
                <div>
                  <p style={{ fontSize: '0.94rem', lineHeight: 1.7, marginBottom: 14, color: 'var(--ink-primary)' }}>
                    <span className="drop-cap">U</span>niLib reimagines the university library as an interconnected digital sanctuary. By uniting physical shelf circulation with 8-semester BE courseware and AI retrieval, scholars explore human knowledge with unprecedented velocity.
                  </p>
                  
                  {/* Live Quick Counters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                    <div style={{ background: 'rgba(238, 228, 204, 0.7)', border: '1px solid rgba(180, 160, 130, 0.5)', padding: 10, borderRadius: 6 }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold-accent)', fontWeight: 700, display: 'block' }}>Physical Titles</span>
                      <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif-display)', color: 'var(--ink-primary)' }}>{liveStats.total_books} Cataloged</strong>
                    </div>
                    <div style={{ background: 'rgba(238, 228, 204, 0.7)', border: '1px solid rgba(180, 160, 130, 0.5)', padding: 10, borderRadius: 6 }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold-accent)', fontWeight: 700, display: 'block' }}>Copies Available</span>
                      <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif-display)', color: 'var(--ink-accent)' }}>{liveStats.available_copies} Ready</strong>
                    </div>
                  </div>
                </div>
              )}

              {currentChapter === 2 && (
                <div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)', marginBottom: 14 }}>
                    Traditional library databases separate physical book loans from modern digital study tools. UniLib unites them under a single, authoritative academic ledger.
                  </p>
                  <div style={{ background: 'rgba(238, 228, 204, 0.6)', borderLeft: '3px solid var(--ink-accent)', padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
                    <strong style={{ fontSize: '0.86rem', display: 'block', color: 'var(--ink-primary)', marginBottom: 2 }}>Complete Academic Coverage</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>8-semester engineering syllabus, peer-reviewed theses, and full-text study notes hub.</span>
                  </div>
                </div>
              )}

              {currentChapter === 3 && (
                <div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)', marginBottom: 14 }}>
                    Our search infrastructure blends lexical BM25 term precision with dense semantic grounding, citing exact page numbers and chapter references in seconds.
                  </p>
                  <div style={{ background: 'rgba(238, 228, 204, 0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(180, 160, 130, 0.4)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-accent)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Verified Grounding
                    </span>
                    <p style={{ fontSize: '0.82rem', margin: 0, fontStyle: 'italic', color: 'var(--ink-primary)' }}>
                      "Every AI answer is cross-referenced with syllabus textbook page ranges to guarantee 100% academic integrity."
                    </p>
                  </div>
                </div>
              )}

              {currentChapter === 4 && (
                <div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)', marginBottom: 14 }}>
                    Empower your academic journey today. Whether you are an undergraduate student preparing for examinations or a faculty librarian managing thousands of volumes.
                  </p>
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <span style={{ fontFamily: 'var(--font-serif-display)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--ink-accent)' }}>
                      "Ex Scientia, Victoria"
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="page-running-footer">
              <span>Folio {currentChapter * 2 - 1}</span>
              <span className="page-num-tag">{currentChapter * 2 - 1}</span>
            </div>
          </div>

          {/* Right Page: Primary Chapter Interactive Content */}
          <div className="book-page-leaf right-page">
            <div className="page-running-header">
              <span>Section {currentChapter} of IV</span>
              <span>UniLib Repository</span>
            </div>

            <div className="page-inner-scroll">
              {/* PAGE 1 = HERO / INTRO */}
              {currentChapter === 1 && (
                <div>
                  <div className="chapter-badge">Entry Portal</div>
                  <h3 style={{ fontFamily: 'var(--font-serif-display)', fontSize: '1.75rem', color: 'var(--ink-primary)', marginBottom: 8 }}>
                    The Next-Generation University Library
                  </h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--ink-secondary)', marginBottom: 18 }}>
                    Welcome to the living archive. Explore physical book circulation, full-text in-browser reading, course syllabus repositories, and intelligent academic synthesis.
                  </p>

                  {/* Feature Parchment Pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(238, 228, 204, 0.7)', borderRadius: 6, border: '1px solid rgba(180, 160, 130, 0.5)' }}>
                      <CheckCircle2 size={18} color="var(--ink-accent)" />
                      <span style={{ fontSize: '0.88rem', color: 'var(--ink-primary)' }}>Instant Physical Book Issue & Digital Reservation</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(238, 228, 204, 0.7)', borderRadius: 6, border: '1px solid rgba(180, 160, 130, 0.5)' }}>
                      <CheckCircle2 size={18} color="var(--ink-accent)" />
                      <span style={{ fontSize: '0.88rem', color: 'var(--ink-primary)' }}>8-Semester BE Computer Syllabus & Lab Guides</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(238, 228, 204, 0.7)', borderRadius: 6, border: '1px solid rgba(180, 160, 130, 0.5)' }}>
                      <CheckCircle2 size={18} color="var(--ink-accent)" />
                      <span style={{ fontSize: '0.88rem', color: 'var(--ink-primary)' }}>Compact E-Reader for PDF and DOCX Volumes</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button className="parchment-action-btn" onClick={() => turnToChapter(2)}>
                      <span>Turn to Features (Page 2)</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* PAGE 2 = FEATURES */}
              {currentChapter === 2 && (
                <div>
                  <div className="chapter-badge">Chapter 02 • Core Systems</div>
                  <h3 style={{ fontFamily: 'var(--font-serif-display)', fontSize: '1.65rem', color: 'var(--ink-primary)', marginBottom: 12 }}>
                    Comprehensive Library Architecture
                  </h3>

                  <div className="parchment-features-grid">
                    <div className="parchment-seal-card">
                      <div className="seal-icon-wrap"><BookOpen size={20} /></div>
                      <h4 className="seal-title">Circulation & Fines</h4>
                      <p className="seal-desc">Automated loan tracking, overdue calculations, and return receipts.</p>
                    </div>

                    <div className="parchment-seal-card">
                      <div className="seal-icon-wrap"><GraduationCap size={20} /></div>
                      <h4 className="seal-title">BE Curriculum Hub</h4>
                      <p className="seal-desc">49 organized courses across 8 semesters with textbooks and slides.</p>
                    </div>

                    <div className="parchment-seal-card">
                      <div className="seal-icon-wrap"><Bot size={20} /></div>
                      <h4 className="seal-title">Hybrid Study AI</h4>
                      <p className="seal-desc">Generate quizzes, active-recall flashcards, and chapter digests.</p>
                    </div>

                    <div className="parchment-seal-card">
                      <div className="seal-icon-wrap"><Database size={20} /></div>
                      <h4 className="seal-title">PDF & DOCX Reader</h4>
                      <p className="seal-desc">In-browser paginated reading with progress sync and dark/sepia themes.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 3 = HOW IT WORKS */}
              {currentChapter === 3 && (
                <div>
                  <div className="chapter-badge">Chapter 03 • Methodology</div>
                  <h3 style={{ fontFamily: 'var(--font-serif-display)', fontSize: '1.65rem', color: 'var(--ink-primary)', marginBottom: 12 }}>
                    How UniLib Powers Learning
                  </h3>

                  <div className="how-it-works-scroll">
                    <div className="how-step-row">
                      <div className="step-num-roman">I</div>
                      <div className="step-content-body">
                        <h4>Explore the Unified Archive</h4>
                        <p>Search physical books on shelf, digital research papers, and faculty lecture notes in one click.</p>
                      </div>
                    </div>

                    <div className="how-step-row">
                      <div className="step-num-roman">II</div>
                      <div className="step-content-body">
                        <h4>Borrow or Read Digitally</h4>
                        <p>Reserve hardcopies with automated due-date alerts, or open digital volumes directly in your browser.</p>
                      </div>
                    </div>

                    <div className="how-step-row">
                      <div className="step-num-roman">III</div>
                      <div className="step-content-body">
                        <h4>Synthesize & Review Notes</h4>
                        <p>Highlight passages, ask conceptual questions to the AI assistant, and export study notes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 4 = CALL TO ACTION / ACCESS */}
              {currentChapter === 4 && (
                <div>
                  <div className="chapter-badge">Chapter 04 • Matriculation</div>
                  <h3 style={{ fontFamily: 'var(--font-serif-display)', fontSize: '1.65rem', color: 'var(--ink-primary)', marginBottom: 12 }}>
                    Begin Your Academic Journey
                  </h3>

                  <div className="parchment-cta-box">
                    <h4 style={{ fontFamily: 'var(--font-serif-display)', fontSize: '1.25rem', color: 'var(--ink-primary)', marginBottom: 8 }}>
                      Create Scholar Account
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', marginBottom: 16 }}>
                      Gain immediate access to university reserves, course study decks, and research archives.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                      <button className="parchment-action-btn" onClick={() => onOpenAuth('register')}>
                        <span>Register as University Member</span>
                        <ArrowRight size={16} />
                      </button>

                      <button
                        className="book-btn-secondary"
                        style={{ color: 'var(--ink-primary)', borderColor: 'var(--ink-muted)' }}
                        onClick={() => onOpenAuth('login')}
                      >
                        Administrative / Faculty Sign In
                      </button>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-muted)', margin: 0 }}>
                    Official University Library System • Academic Year 2026
                  </p>
                </div>
              )}

              {/* Bottom Leaf Corner Navigation Cue */}
              {currentChapter < 4 && (
                <div className="book-leaf-corner-cue" onClick={() => turnToChapter(currentChapter + 1)}>
                  <span>Turn to Page {currentChapter + 1}</span>
                  <ChevronRight size={14} />
                </div>
              )}
            </div>

            <div className="page-running-footer">
              <span>Folio {currentChapter * 2}</span>
              <span className="page-num-tag">{currentChapter * 2}</span>
            </div>
          </div>

          {/* 3D Page Turn Flipping Leaf (CSS 3D Transform Leaf) */}
          {isFlipping && (
            <div className={`page-turning-flipper flipping-${flipDirection}`}>
              <div className="paper-curl-shadow" />
              <div className="flipper-face front-face">
                <div className="page-running-header">
                  <span>Section {currentChapter}</span>
                  <span>Turning...</span>
                </div>
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.35 }}>
                  <BookOpen size={48} color="var(--ink-accent)" />
                </div>
              </div>
              <div className="flipper-face back-face">
                <div className="page-running-header">
                  <span>Section {flipDirection === 'forward' ? currentChapter + 1 : currentChapter - 1}</span>
                  <span>Unfolding...</span>
                </div>
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.35 }}>
                  <Bookmark size={48} color="var(--gold-accent)" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Page Navigation Controls (Arrows & Chapter Dots) */}
      <div className="book-turn-controls">
        <button
          className="turn-arrow-btn"
          onClick={() => turnToChapter(currentChapter - 1)}
          disabled={currentChapter <= 1 || isFlipping}
          title="Previous Page (←)"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="chapter-indicators-row">
          {[1, 2, 3, 4].map((ch) => (
            <button
              key={ch}
              className={`chapter-dot-btn ${currentChapter === ch ? 'active' : ''}`}
              onClick={() => turnToChapter(ch)}
              disabled={isFlipping}
              title={`Chapter ${ch}: ${ch === 1 ? 'Introduction' : ch === 2 ? 'Features' : ch === 3 ? 'How It Works' : 'Matriculation'}`}
            />
          ))}
        </div>

        <button
          className="turn-arrow-btn"
          onClick={() => turnToChapter(currentChapter + 1)}
          disabled={currentChapter >= 4 || isFlipping}
          title="Next Page (→)"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
