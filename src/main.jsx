import React from 'react';
import ReactDOM from 'react-dom/client';
// base styles first, so component styles can override them
import './index.css';
import App from './App.jsx';
import { seasonal } from './content/site.js';

// set before the first paint, so the season's colours never flash in
if (seasonal.theme) document.documentElement.dataset.season = seasonal.theme;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
