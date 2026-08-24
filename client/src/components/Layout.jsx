import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  CalendarClock,
  Receipt,
  ShieldCheck,
  Library,
  ChevronRight,
  Radio,
  BookOpenCheck,
  FileBarChart,
  LogOut,
  BellRing,
  Globe,
  GraduationCap,
  BookMarked,
  FileCode
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

export default function Layout({ activeTab, onTabChange, currentUser, onLogout, onGoToLanding, children }) {
  const isStudent = currentUser?.role === 'student';
  const { addToast } = useToast();

  const tabs = isStudent
    ? [
        { key: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard, category: 'Account' },
        { key: 'curriculum', label: 'Course Curriculum', icon: GraduationCap, category: 'Academics' },
        { key: 'notes', label: 'My Study Notes', icon: BookMarked, category: 'Academics' },
        { key: 'books', label: 'Browse Catalog', icon: BookOpen, category: 'Library' },
        { key: 'ebooks', label: 'Digital E-Library', icon: BookOpenCheck, category: 'Library' },
        { key: 'research', label: 'Research & Theses', icon: FileCode, category: 'Research' },
        { key: 'borrows', label: 'My Loans & Due Dates', icon: ArrowLeftRight, category: 'Circulation' },
        { key: 'reservations', label: 'My Book Holds', icon: CalendarClock, category: 'Circulation' },
        { key: 'fines', label: 'My Fines & Fees', icon: Receipt, category: 'Account' },
      ]
    : [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Core' },
        { key: 'curriculum', label: 'Course Curriculum', icon: GraduationCap, category: 'Academics' },
        { key: 'research', label: 'Research Repository', icon: FileCode, category: 'Research' },
        { key: 'books', label: 'Physical Catalog', icon: BookOpen, category: 'Catalog' },
        { key: 'ebooks', label: 'Digital E-Library', icon: BookOpenCheck, category: 'Catalog' },
        { key: 'members', label: 'Members Directory', icon: Users, category: 'Manage' },
        { key: 'borrows', label: 'Circulation Desk', icon: ArrowLeftRight, category: 'Circulation' },
        { key: 'reservations', label: 'All Reservations', icon: CalendarClock, category: 'Circulation' },
        { key: 'fines', label: 'Fines Management', icon: Receipt, category: 'Finance' },
        { key: 'reports', label: 'MCR Reports', icon: FileBarChart, category: 'Audit' },
        { key: 'audit', label: 'System Audit Log', icon: ShieldCheck, category: 'System' },
      ];

  const currentTabObj = tabs.find((t) => t.key === activeTab) || tabs[0];
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleQuickReminders = async () => {
    try {
      const res = await api.sendReminders();
      addToast(`Dispatched ${res.total_notifications} automated email alerts!`, 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div
          className="sidebar-header"
          onClick={onGoToLanding}
          style={{ cursor: 'pointer' }}
          title="Return to Public Landing Page"
        >
          <div className="sidebar-brand-icon">
            <Library size={22} />
          </div>
          <div>
            <h2 className="sidebar-title">
              UniLib <span className="badge-mini">{isStudent ? 'Student' : 'Admin'}</span>
            </h2>
            <span className="sidebar-subtitle">University Library</span>
          </div>
        </div>

        <ul className="sidebar-nav">
          <li className="nav-section-label">
            {isStudent ? 'Student Portal' : 'Staff Administration'}
          </li>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <li key={t.key}>
                <button
                  className={isActive ? 'active' : ''}
                  onClick={() => onTabChange(t.key)}
                >
                  <span className="sidebar-icon">
                    <Icon size={18} />
                  </span>
                  <span>{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* User Card in Sidebar */}
        {currentUser && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`user-avatar ${currentUser.role}`} style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                {getInitials(currentUser.name)}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {currentUser.role} (ID #{currentUser.id})
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="status-pill">
            <span className="status-dot-live"></span>
            <span className="status-text">Live System</span>
          </div>
          <span className="version-tag">RBAC 2.0</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Sticky Header */}
        <header className="top-header no-print">
          <div className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={onGoToLanding}
                className="ghost"
                style={{
                  padding: '4px 12px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(212, 175, 55, 0.28)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  cursor: 'pointer'
                }}
                title="Return to Public Landing Page"
              >
                <Library size={15} /> UniLib
              </button>
              <div style={{ width: 1, height: 18, background: 'rgba(255, 255, 255, 0.12)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentTabObj.category}</span>
                <ChevronRight size={13} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#fff' }}>{currentTabObj.label}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {!isStudent && (
              <button
                className="ghost"
                onClick={handleQuickReminders}
                title="Dispatch Automated Email Reminders"
                style={{ fontSize: '0.8rem', gap: 6 }}
              >
                <BellRing size={15} color="var(--primary)" />
                <span className="hide-mobile">Send Reminders</span>
              </button>
            )}

            <div className="status-pill" style={{ background: 'transparent' }}>
              <Radio size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentDate}</span>
            </div>

            {currentUser && (
              <button
                className="secondary"
                onClick={onLogout}
                title="Sign Out"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}