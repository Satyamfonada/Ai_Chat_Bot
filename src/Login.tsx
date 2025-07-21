// src/Login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from './supabaseClient.ts';
import bcrypt from 'bcryptjs';
import './Auth.css';

// Add prop type
interface LoginProps {
  onLogin: (user: { id: string; username: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Fetch user by username
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (fetchError || !user) {
      setError('Invalid username or password.');
      return;
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      setError('Invalid username or password.');
      return;
    }

    // Store user in localStorage (or context)
    const userObj = { id: user.id, username: user.username };
    localStorage.setItem('user', JSON.stringify(userObj));
    onLogin(userObj); // Update App state immediately
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear all localStorage, not just 'user'
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;