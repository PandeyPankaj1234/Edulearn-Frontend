import { useEffect, useState } from 'react';
import { DollarSign, CreditCard, RefreshCcw, Search, RefreshCw } from 'lucide-react';
import { paymentApi } from '../api/services';
import Loading from '../components/Loading';

export default function AdminPayments() {
  const [payments, setPayments]         = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('payments');
  const [search, setSearch]             = useState('');

  async function load() {
    setLoading(true);
    try {
      const [pmts, subs] = await Promise.all([
        paymentApi.allPayments().catch(() => []),
        paymentApi.allSubscriptions().catch(() => []),
      ]);
      setPayments(Array.isArray(pmts) ? pmts : []);
      setSubscriptions(Array.isArray(subs) ? subs : []);
    } catch { setPayments([]); setSubscriptions([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRefund(paymentId) {
    if (!window.confirm('Process refund for this payment?')) return;
    try {
      await paymentApi.refund(paymentId);
      setPayments(prev => prev.map(p => p.paymentId === paymentId ? { ...p, status: 'REFUNDED' } : p));
    } catch { alert('Refund failed. Please try again.'); }
  }

  async function handleCancelSub(subscriptionId) {
    if (!window.confirm('Cancel this subscription?')) return;
    try {
      await paymentApi.cancelSubscription(subscriptionId);
      setSubscriptions(prev => prev.map(s => s.subscriptionId === subscriptionId ? { ...s, status: 'Cancelled' } : s));
    } catch { alert('Cancellation failed.'); }
  }

  async function handleRefundSub(subscriptionId) {
    if (!window.confirm('Refund and cancel this subscription? This cannot be undone.')) return;
    try {
      const updated = await paymentApi.refundSubscription(subscriptionId);
      setSubscriptions(prev => prev.map(s => s.subscriptionId === subscriptionId ? updated : s));
    } catch { alert('Subscription refund failed.'); }
  }

  if (loading) return <Loading label="Loading financial data..." />;

  const totalRevenue  = payments.filter(p => (p.status||'').toUpperCase() === 'SUCCESS').reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunded = payments.filter(p => (p.status||'').toUpperCase() === 'REFUNDED').reduce((s, p) => s + (p.amount || 0), 0);
  const activeSubs    = subscriptions.filter(s => (s.status||'').toUpperCase() === 'ACTIVE').length;

  const q = search.toLowerCase();
  const filteredPayments = payments.filter(p =>
    (p.studentId?.toString() || '').includes(q) ||
    (p.paymentId?.toString() || '').includes(q) ||
    (p.status || '').toLowerCase().includes(q)
  );
  const filteredSubs = subscriptions.filter(s =>
    (s.studentId?.toString() || '').includes(q) ||
    (s.plan || '').toLowerCase().includes(q) ||
    (s.status || '').toLowerCase().includes(q)
  );

  const statusClass = s => {
    const u = (s || '').toUpperCase();
    if (u === 'SUCCESS' || u === 'ACTIVE') return 'status-active';
    if (u === 'PENDING') return 'status-pending';
    if (u === 'FAILED' || u === 'CANCELLED') return 'status-failed';
    if (u === 'REFUNDED') return 'status-inactive';
    return 'status-inactive';
  };

  return (
    <section className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Platform Payments</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor all transactions, subscriptions, and refunds.</p>
        </div>
        <button className="icon-button" onClick={load}><RefreshCw size={16}/></button>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--accent)', background: 'rgba(16,185,129,.1)' }}><DollarSign size={24}/></div>
          <span>Total Revenue</span>
          <strong>${totalRevenue.toLocaleString()}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,.1)' }}><CreditCard size={24}/></div>
          <span>Active Subscriptions</span>
          <strong>{activeSubs}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: '#f43f5e', background: 'rgba(244,63,94,.1)' }}><RefreshCcw size={24}/></div>
          <span>Total Refunded</span>
          <strong>${totalRefunded.toLocaleString()}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-solid)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {['payments', 'subscriptions'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all .2s', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {tab === 'payments' ? (
          <table className="data-table">
            <thead><tr><th>Payment ID</th><th>Student</th><th>Course</th><th>Amount</th><th>Mode</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredPayments.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No payments found.</td></tr>
                : filteredPayments.map((p, i) => (
                  <tr key={p.paymentId || i}>
                    <td><code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.paymentId || p.transactionId || '—'}</code></td>
                    <td style={{ fontWeight: '500' }}>Student #{p.studentId}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Course #{p.courseId}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>${Number(p.amount || 0).toFixed(2)}</td>
                    <td><span className="status-badge status-pending">{p.mode || p.currency || '—'}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                    <td><span className={`status-badge ${statusClass(p.status)}`}>{p.status}</span></td>
                    <td>
                      {(p.status||'').toUpperCase() === 'SUCCESS' && (
                        <button className="button button-danger" style={{ minHeight: '28px', padding: '0 10px', fontSize: '11px' }} onClick={() => handleRefund(p.paymentId)}>
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead><tr><th>Sub ID</th><th>Student</th><th>Plan</th><th>Amount</th><th>Start</th><th>End</th><th>Auto-Renew</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredSubs.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No subscriptions found.</td></tr>
                : filteredSubs.map((s, i) => (
                  <tr key={s.subscriptionId || i}>
                    <td><code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.subscriptionId}</code></td>
                    <td style={{ fontWeight: '500' }}>Student #{s.studentId}</td>
                    <td><span className="status-badge status-pending">{s.plan}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>${Number(s.amountPaid || 0).toFixed(2)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: '13px', color: s.autoRenew ? 'var(--accent)' : 'var(--text-muted)' }}>{s.autoRenew ? '✓ Yes' : '✗ No'}</td>
                    <td><span className={`status-badge ${statusClass(s.status)}`}>{s.status}</span></td>
                    <td>
                      {(s.status||'').toUpperCase() === 'ACTIVE' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="button button-danger" style={{ minHeight: '28px', padding: '0 10px', fontSize: '11px' }} onClick={() => handleCancelSub(s.subscriptionId)}>
                            Cancel
                          </button>
                          <button style={{ minHeight: '28px', padding: '0 10px', fontSize: '11px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '600' }} onClick={() => handleRefundSub(s.subscriptionId)}>
                            Refund
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
