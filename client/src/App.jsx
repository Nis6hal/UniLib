import React, { useState } from 'react';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import MemberList from './components/MemberList';
import BorrowForm from './components/BorrowForm';
import ReservationList from './components/ReservationList';
import FineList from './components/FineList';
import AuditLog from './components/AuditLog';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'books': return <BookList />;
      case 'members': return <MemberList />;
      case 'borrows': return <BorrowForm />;
      case 'reservations': return <ReservationList />;
      case 'fines': return <FineList />;
      case 'audit': return <AuditLog />;
      default: return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTab()}
      </Layout>
    </ToastProvider>
  );
}