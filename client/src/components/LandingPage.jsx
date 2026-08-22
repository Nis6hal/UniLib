import React from 'react';
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
  Compass,
  FileCode
} from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  const circulationRules = [
    {
      icon: Layers,
      title: 'Borrowing Quota',
      desc: 'Each student account is granted up to 5 concurrent physical loans across university catalogs.'
    },
    {
      icon: CalendarClock,
      title: '14-Day Loan Period',
      desc: 'Standard initial checkout period of 14 days, renewable up to 2 times (+14 days each) if no holds exist.'
    },
    {
      icon: Receipt,
      title: 'Overdue Fines Engine',
      desc: 'Late returns accrue a standard university penalty of $0.50 per day with instant 1-click fine settlement.'
    },
    {
      icon: RotateCw,
      title: 'Smart Hold Shelf TTL',
      desc: 'When a reserved book is checked in, the system automatically holds it for 3 days before passing to the next student in queue.'
    }
  ];

  const faqs = [
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
  ];

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="sidebar-brand-icon" style={{ width: 38, height: 38 }}>
            <Library size={20} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            UniLib <span className="badge-mini" style={{ marginLeft: 6 }}>Academic v2.0</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="secondary" onClick={() => onOpenAuth('login')}>
            Sign In
          </button>
          <button onClick={() => onOpenAuth('register')}>
            Create Account <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge animate-in">
          <Sparkles size={14} color="var(--primary)" />
          <span>Unified University Library & Research Platform</span>
        </div>

        <h1 className="hero-headline animate-in">
          The Intelligent Library & <br />
          <span style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f59e0b 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Digital Knowledge Ecosystem
          </span>
        </h1>

        <p className="hero-subtext animate-in">
          An integrated institutional platform engineered for physical book circulation, bulk folder digital document uploads, in-browser academic reading, and audited circulation governance.
        </p>

        <div className="hero-cta-group animate-in">
          <button style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={() => onOpenAuth('register')}>
            <Sparkles size={18} /> Register Student Account
          </button>
          <button className="secondary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={() => onOpenAuth('login')}>
            Staff & Member Sign In <ArrowRight size={18} />
          </button>
        </div>

        {/* Live Metrics Strip */}
        <div className="hero-stats-strip animate-in">
          <div className="hero-stat-item">
            <strong>5 Books</strong>
            <span>Student Loan Limit</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <strong>14 Days</strong>
            <span>Standard Duration</span>
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
      <section style={{ width: '100%', overflow: 'hidden', padding: '10px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)', fontWeight: 700 }}>
            Curated University Collection
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
              // Duplicate set for seamless infinite scroll
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

      {/* Core Architectural Pillars */}
      <section className="landing-features">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Institutional Architecture
          </h2>
          <p className="subtitle">Designed around the daily workflows of students, faculty, and academic librarians</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BookOpen size={24} />
            </div>
            <h3>Multi-Copy Physical Catalog</h3>
            <p>
              Tracks individual book copies, real-time shelf status (Available, Borrowed, Reserved), and ISBN indexing with automated waitlist allocation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <FolderUp size={24} />
            </div>
            <h3>Bulk Folder Digital Repository</h3>
            <p>
              Upload entire folders of course notes or textbooks. The engine parses authors, titles, and formats (.pdf, .docx, .epub) in a single batch.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BookMarked size={24} />
            </div>
            <h3>In-Browser Document Reader</h3>
            <p>
              Full-featured reading suite with Dark Obsidian, Warm Sepia, and Crisp Light themes, fluid zoom scaling, and distraction-free fullscreen.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BellRing size={24} />
            </div>
            <h3>Automated Email Alerts</h3>
            <p>
              SMTP notification dispatcher automatically alerts students 2 days prior to loan deadlines and triggers hold collection reminders.
            </p>
          </div>
        </div>
      </section>

      {/* Library Governance & Policies Section */}
      <section style={{ padding: '40px 48px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Circulation Policies & Rules
          </h2>
          <p className="subtitle">Standardized governance rules built into the automated transaction engine</p>
        </div>

        <div className="features-grid">
          {circulationRules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div key={idx} className="feature-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: 8, borderRadius: 'var(--radius-sm)' }}>
                    <Icon size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{rule.title}</h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {rule.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Institutional Security & Audit Section */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ padding: 40, border: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(18,22,30,0.95), rgba(10,12,16,0.95))' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>
            <div>
              <span className="hero-badge" style={{ marginBottom: 16 }}>
                <ShieldCheck size={14} color="var(--primary)" /> Academic Governance
              </span>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
                Role-Based Access & Tamper-Evident Audit Trails
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 20 }}>
                UniLib enforces strict role separation between Students, Faculty Librarians, and Administrators. Every borrow, return, fine settlement, and permission change is recorded in an immutable audit ledger.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> Cryptographic Passwords
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> Automated MCR Reports
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> 6-Digit Email OTP Verification
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} /> Monthly Circulation Reports (MCR)
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Generate official audited PDF reports on monthly circulation volumes, fine revenues, and student on-time compliance rates with institutional letterhead.
              </p>
              <button className="secondary" style={{ width: '100%', fontSize: '0.82rem' }} onClick={() => onOpenAuth('login')}>
                Sign In to View System Reports
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h2>
          <p className="subtitle">Common inquiries regarding accounts, circulation, and digital reader tools</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {faqs.map((faq, idx) => (
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

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          <strong>UniLib</strong> — University Library Management System
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Academic Release 2.0 • Greyish Black & Gold Edition
        </div>
      </footer>
    </div>
  );
}
