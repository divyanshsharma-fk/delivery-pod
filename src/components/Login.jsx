import { useState } from 'react';
import { loginDriver } from '../api';

export default function Login({ onLogin, onAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await loginDriver(email.trim(), password);
      if (result.success) {
        onLogin(result.driver);
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>Delivery POD</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>
          Proof of Delivery System
        </p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
          Driver Login
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="banner banner-error" style={{ marginBottom: 12, marginLeft: 0, marginRight: 0 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onAdmin}
            style={{
              background: 'none', border: 'none', color: 'var(--text-sub)',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Admin View
          </button>
        </div>
      </div>
    </div>
  );
}
