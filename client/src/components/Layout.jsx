import React, { useState } from 'react';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'books', label: 'Books', icon: '📚' },
  { key: 'members', label: 'Members', icon: '👥' },
  { key: 'borrows', label: 'Issue / Return', icon: '📥' },
  { key: 'reservations', label: 'Reservations', icon: '📋' },
  { key: 'fines', label: 'Fines', icon: '💰' },
  { key: 'audit', label: 'Audit Log', icon: '📝' },
];

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">UniLib</h2>
          <span className="sidebar-subtitle">Library Management</span>
        </div>
        <ul className="sidebar-nav">
          {tabs.map((t) => (
            <li key={t.key}>
              <button
                className={activeTab === t.key ? 'active' : ''}
                onClick={() => onTabChange(t.key)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span>API Online</span>
          </div>
          <span style={{ opacity: 0.6 }}>UniLib v1.0.0</span>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}