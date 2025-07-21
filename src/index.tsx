import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatBot from './ChatBot.tsx';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ChatBot />
  </React.StrictMode>
);
