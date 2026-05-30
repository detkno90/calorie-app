import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess('Account created! Check your email to confirm, or log in now.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🥗</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>CalTrack</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>Your personal calorie tracker</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--card)', borderRadius: 24,
        padding: '28px 24px',
      }}>
        {/* Tabs */}
        <div className="segment-control" style={{ marginBottom: 24 }}>
          <button className={`segment-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
            Log In
          </button>
          <button className={`segment-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input" type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoCapitalize="none"
            />
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Password</label>
            <input
              className="input" type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,91,91,0.12)', color: '#EF5B5B', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(76,175,130,0.12)', color: '#4CAF82', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              {success}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 24, textAlign: 'center' }}>
        Your data is private and secure
      </div>
    </div>
  );
}
