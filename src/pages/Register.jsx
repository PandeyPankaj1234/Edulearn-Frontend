import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate  = useNavigate();
  const { register } = useAuth();
  const [form, setForm]       = useState({ fullName: '', email: '', password: '', role: 'Student' });
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Extract the backend error message from response body
      const msg = err?.response?.data?.message
        || err?.response?.data
        || err?.message
        || 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="brand-mark">EL</span>
          <h1>Create account</h1>
          <p>Join as a student or instructor. You'll be asked to log in after registering.</p>
        </div>

        {success ? (
          /* ── Success state ── */
          <div className="form-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle2 size={52} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: '22px' }}>Account Created!</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Your account has been created successfully.<br />
              Redirecting you to login…
            </p>
            <Link to="/login" className="button button-primary" style={{ marginTop: '8px' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          /* ── Registration form ── */
          <form className="form-panel" onSubmit={handleSubmit}>
            <label>
              Full Name *
              <input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. John Doe"
                required
              />
            </label>

            <label>
              Email *
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. john@example.com"
                required
              />
            </label>

            <label>
              Password * <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>(min 6 characters)</span>
              <input
                type="password"
                minLength="6"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Create a strong password"
                required
              />
            </label>

            <label>
              Register as
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '12px 16px' }}>
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
              </select>
            </label>

            {error && (
              <p style={{ color: '#f43f5e', fontSize: '14px', margin: '0', padding: '10px 14px', background: 'rgba(244,63,94,.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244,63,94,.2)' }}>
                {error}
              </p>
            )}

            <button className="button button-primary" type="submit" disabled={busy}>
              <UserPlus size={18} />
              {busy ? 'Creating account…' : 'Register'}
            </button>

            <p className="muted" style={{ textAlign: 'center', marginTop: '4px' }}>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
