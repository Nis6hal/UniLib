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
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}