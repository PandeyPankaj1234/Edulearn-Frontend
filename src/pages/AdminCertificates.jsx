import { useEffect, useState } from 'react';
import { Award, Search, CheckCircle2, RefreshCw, Shield } from 'lucide-react';
import { progressApi } from '../api/services';
import Loading from '../components/Loading';

export default function AdminCertificates() {
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await progressApi.allCertificates();
      setCerts(Array.isArray(data) ? data : []);
    } catch { setCerts([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(e) {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifying(true); setVerifyResult(null);
    try {
      const result = await progressApi.verifyCertificate(verifyCode.trim());
      setVerifyResult({ valid: true, data: result });
    } catch {
      setVerifyResult({ valid: false });
    }
    setVerifying(false);
  }

  if (loading) return <Loading label="Loading certificates..." />;

  const q = search.toLowerCase();
  const filtered = certs.filter(c =>
    (c.courseName || c.courseTitle || '').toLowerCase().includes(q) ||
    (c.studentName || '').toLowerCase().includes(q) ||
    (c.verificationCode || '').toLowerCase().includes(q)
  );

  return (
    <section className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Certificates</h1>
          <p style={{ color: 'var(--text-muted)' }}>View all issued certificates and verify authenticity.</p>
        </div>
        <button className="icon-button" onClick={load}><RefreshCw size={16}/></button>
      </div>

      {/* Stats */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        <div className="metric">
          <div className="metric-icon" style={{ color: '#a78bfa', background: 'rgba(167,139,250,.1)' }}><Award size={24}/></div>
          <span>Total Certificates</span>
          <strong>{certs.length}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--accent)', background: 'rgba(16,185,129,.1)' }}><CheckCircle2 size={24}/></div>
          <span>Verified Certificates</span>
          <strong>{certs.length}</strong>
        </div>
      </div>

      {/* Verify Certificate Tool */}
      <div className="panel">
        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} color="var(--primary)"/> Certificate Verification Tool
        </h2>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
            placeholder="Enter verification code (e.g. CERT-ABC123...)"
            style={{ flex: 1, minWidth: '240px', fontFamily: 'monospace' }}
          />
          <button type="submit" className="button button-primary" disabled={verifying} style={{ minHeight: '42px', padding: '0 24px' }}>
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        {verifyResult && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)', background: verifyResult.valid ? 'rgba(16,185,129,.1)' : 'rgba(244,63,94,.1)', border: `1px solid ${verifyResult.valid ? 'rgba(16,185,129,.3)' : 'rgba(244,63,94,.3)'}` }}>
            {verifyResult.valid ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--accent)' }}>✓ Valid Certificate</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Course: <strong>{verifyResult.data?.courseName || verifyResult.data?.courseTitle || '—'}</strong> |
                    Student: <strong>{verifyResult.data?.studentName || '—'}</strong> |
                    Issued: <strong>{verifyResult.data?.issuedAt ? new Date(verifyResult.data.issuedAt).toLocaleDateString() : '—'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#f43f5e', fontWeight: '600' }}>✗ Invalid or expired certificate code.</div>
            )}
          </div>
        )}
      </div>

      {/* All Certificates Table */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '20px' }}>All Issued Certificates</h2>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', padding: '8px 12px 8px 32px' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="state-box" style={{ background: 'transparent', border: 'none' }}>
            <Award size={36} style={{ color: 'var(--text-muted)', opacity: .4 }} />
            <h3>No certificates issued yet</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Student</th><th>Course</th><th>Instructor</th><th>Issued On</th><th>Verification Code</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.certificateId || i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: '500' }}>{c.studentName || `Student #${c.studentId}`}</td>
                    <td style={{ fontSize: '13px' }}>{c.courseName || c.courseTitle || `Course #${c.courseId}`}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.instructorName || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(99,102,241,.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.verificationCode || c.certificateCode || '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
