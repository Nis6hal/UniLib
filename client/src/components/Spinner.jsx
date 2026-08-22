import React from 'react';

export default function Spinner({ message = 'Loading UniLib...' }) {
  return (
    <div className="spinner-wrapper animate-in">
      <div className="spinner-ring"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.02em' }}>
        {message}
      </p>
    </div>
  );
}