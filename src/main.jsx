import React from 'react';
import ReactDOM from 'react-dom/client';
// base styles first, so component styles can override them
import './index.css';
import App from './App.jsx';
import { applySeason, seasonFor } from './lib/occasion.js';

// set before the first paint, so the season's colours never flash in
applySeason(seasonFor());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
