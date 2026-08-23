import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import MemberList from './components/MemberList';
import BorrowForm from './components/BorrowForm';
import ReservationList from './components/ReservationList';
import FineList from './components/FineList';
import AuditLog from './components/AuditLog';
import EBookReader from './components/EBookReader';
import ReportsView from './components/ReportsView';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import CourseCurriculum from './components/CourseCurriculum';
import StudyNotesHub from './components/StudyNotesHub';
import ResearchRepository from './components/ResearchRepository';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('unilib_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [viewState, setViewState] = useState(() => {
    const saved = localStorage.getItem('unilib_user');
    return saved ? 'app' : 'landing'; // 'landing' | 'app'
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('unilib_user', JSON.stringify(user));
    } catch {}
    setViewState('app');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('unilib_user');
    } catch {}
    setViewState('landing');
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'curriculum':
        return <CourseCurriculum currentUser={currentUser} onNavigateToBook={() => setActiveTab('books')} onNavigateToReader={() => setActiveTab('ebooks')} />;
      case 'notes':
        return <StudyNotesHub currentUser={currentUser} onOpenReader={() => setActiveTab('ebooks')} />;
      case 'research':
        return <ResearchRepository currentUser={currentUser} />;
      case 'books':
        return <BookList currentUser={currentUser} />;
      case 'ebooks':
        return <EBookReader currentUser={currentUser} />;
      case 'members':
        return <MemberList currentUser={currentUser} />;
      case 'borrows':
        return <BorrowForm currentUser={currentUser} />;
      case 'reservations':
        return <ReservationList currentUser={currentUser} />;
      case 'fines':
        return <FineList currentUser={currentUser} />;
      case 'reports':
        return <ReportsView currentUser={currentUser} />;
      case 'audit':
        return <AuditLog currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  return (
    <ToastProvider>
      {viewState === 'landing' ? (
        <LandingPage
          onOpenAuth={handleOpenAuth}
        />
      ) : (
        <Layout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onGoToLanding={() => setViewState('landing')}
        >
          {renderTab()}
        </Layout>
      )}

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </ToastProvider>
  );
}