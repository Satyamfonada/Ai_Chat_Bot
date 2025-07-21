// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatBot from './ChatBot.tsx';
import Login from './Login.tsx';
import Signup from './Signup.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Add this effect to detect localStorage changes in the same tab
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser && user) {
      setUser(null);
    } else if (storedUser && (!user || storedUser !== JSON.stringify(user))) {
      setUser(JSON.parse(storedUser));
    }
  });

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <ChatBot /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
