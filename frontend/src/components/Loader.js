import React from 'react';

export default function Loader({ message = 'Loading data...' }) {
  return (
    <div className="loader-container">
      <div className="spinner-wrapper">
        <div className="spinner" />
        <div className="spinner-inner" />
      </div>
      <p className="loader-message">{message}</p>
    </div>
  );
}
