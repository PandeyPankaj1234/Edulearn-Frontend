import { Construction } from 'lucide-react';

export default function ComingSoon({ title, description }) {
  return (
    <section className="page-stack">
      <div className="auth-copy" style={{ borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>{title}</h1>
        <p style={{ maxWidth: '600px', fontSize: '16px' }}>{description}</p>
      </div>

      <div className="panel" style={{ display: 'grid', placeItems: 'center', minHeight: '400px', textAlign: 'center', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-solid) 100%)' }}>
        <div style={{ maxWidth: '400px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
            <Construction size={40} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Under Construction</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            We are working hard to bring this feature to life. The <strong>{title}</strong> module will be available in the next major release!
          </p>
          <button className="button button-primary" style={{ marginTop: '24px' }} onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    </section>
  );
}
