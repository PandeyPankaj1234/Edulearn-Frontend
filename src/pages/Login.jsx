import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, Users, Shield, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

// Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { login, loginWithToken, mockLogin } = useAuth();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const clientIdConfigured =
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    !import.meta.env.VITE_GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE');

  /* ─── Email / password login ───────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials or use quick login below.');
    } finally {
      setBusy(false);
    }
  }

  /* ─── Quick mock login ─────────────────────────────────────────────────── */
  function handleMockLogin(role) {
    mockLogin(role);
    if (role === 'Admin') navigate('/admin');
    else if (role === 'Instructor') navigate('/instructor');
    else navigate('/');
  }

  /* ─── Real Google OAuth ────────────────────────────────────────────────── */
  const googleLogin = useGoogleLogin({
    // ① Use authorization_code flow so backend can get full profile
    flow: 'implicit',

    onSuccess: async (tokenResponse) => {
      setGoogleBusy(true);
      setError('');
      try {
        // Fetch user profile from Google using the access token
        const profileRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const profile = await profileRes.json();
        // { sub, email, name, picture, email_verified }

        // Send to backend for JWT issuance
        const data = await apiClient.post('/api/auth/google', {
          googleId:   profile.sub,
          email:      profile.email,
          name:       profile.name,
          pictureUrl: profile.picture,
        });

        // data = { token, role, userId, email, name }
        if (data?.token) {
          loginWithToken(data);
          if (data.role === 'Admin') navigate('/admin');
          else if (data.role === 'Instructor') navigate('/instructor');
          else navigate('/');
        } else {
          throw new Error('No token received from server.');
        }
      } catch (err) {
        setError(err.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleBusy(false);
      }
    },

    onError: (err) => {
      console.error('Google OAuth error:', err);
      setError('Google sign-in was cancelled or failed.');
    },
  });

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="brand-mark" style={{ marginBottom: '24px' }}>EL</div>
          <h1>Welcome back</h1>
          <p>Sign in to continue learning, track progress, and manage your EduLearn courses.</p>
        </div>

        <div className="form-panel">
          <h2>Sign In</h2>
          <p>Enter your credentials to access your account.</p>

          {/* ── Google Button ────────────────────────────────────────────── */}
          {clientIdConfigured ? (
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={googleBusy}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', padding: '12px 20px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--surface-solid)',
                color: 'var(--text-main)', fontSize: '14px', fontWeight: '600',
                cursor: googleBusy ? 'not-allowed' : 'pointer',
                opacity: googleBusy ? 0.7 : 1,
                transition: 'all 0.2s', marginBottom: '20px',
              }}
              onMouseEnter={e => { if (!googleBusy) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-solid)'}
            >
              <GoogleIcon />
              {googleBusy ? 'Signing in...' : 'Continue with Google'}
            </button>
          ) : (
            /* ── Not configured notice ─────────────────────────────────── */
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b', margin: '0 0 2px' }}>
                  Google Client ID not configured
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Add <code style={{ background: 'var(--surface-solid)', padding: '1px 5px', borderRadius: '3px' }}>VITE_GOOGLE_CLIENT_ID</code> to <code style={{ background: 'var(--surface-solid)', padding: '1px 5px', borderRadius: '3px' }}>.env</code> to enable Google sign-in.
                  &nbsp;<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Get Client ID →</a>
                </p>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '0 0 20px', position: 'relative' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
              OR SIGN IN WITH EMAIL
            </span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy} style={{ marginTop: '8px' }}>
              <LogIn size={18} /> {busy ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
              QUICK LOGIN (TESTING)
            </span>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <button type="button" className="button button-secondary" onClick={() => handleMockLogin('Student')}>
              <User size={18} /> Login as Student
            </button>
            <button type="button" className="button button-secondary" onClick={() => handleMockLogin('Instructor')}>
              <Users size={18} /> Login as Instructor
            </button>
            <button type="button" className="button button-secondary" onClick={() => handleMockLogin('Admin')}>
              <Shield size={18} /> Login as Admin
            </button>
          </div>

          <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            New here? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
