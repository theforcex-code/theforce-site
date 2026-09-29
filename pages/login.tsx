import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      setError('Senha incorreta.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    }}>
      <div style={{ textAlign: 'center', width: 320 }}>
        <div style={{
          fontSize: 13,
          letterSpacing: '0.25em',
          color: '#fff',
          marginBottom: 48,
          fontWeight: 500,
        }}>
          THE FORCE
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #333',
              color: '#fff',
              fontSize: 16,
              padding: '12px 0',
              outline: 'none',
              textAlign: 'center',
              letterSpacing: '0.1em',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ color: '#666', fontSize: 12, marginTop: 16, letterSpacing: '0.1em' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 32,
              background: 'transparent',
              border: '1px solid #333',
              color: '#fff',
              fontSize: 11,
              letterSpacing: '0.2em',
              padding: '12px 32px',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? '...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
