import React from 'react';

export default function Spinner({ size = 36 }) {
  return (
    <div className="spinner-wrapper" style={{ '--spinner-size': `${size}px` }}>
      <div className="spinner"></div>
    </div>
  );
}