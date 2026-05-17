import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, DollarSign, Zap, Crown, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../api/services';
import { useRazorpay } from '../hooks/useRazorpay';
import Loading from '../components/Loading';

const PRO_PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 29,
    period: '/month',
    description: 'Billed monthly. Cancel anytime.',
    features: ['Access to all 500+ premium courses', '1-on-1 mentorship sessions', 'Downloadable offline content', 'Priority support', 'Certificates of completion'],
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 199,
    period: '/year',
    badge: 'Save 43%',
    description: 'Billed annually. Best value.',
    features: ['Everything in Monthly', 'Free 1 private mentorship/month', 'Early access to new courses', 'Exclusive Pro community', 'Resume review service'],
  },
];

export default function Payments() {
  const { user } = useAuth();
  const { openCheckout, MockModal } = useRazorpay();

  const [loading, setLoading]       = useState(true);
  const [payments, setPayments]     = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const uid = user?.userId || user?.id;
      if (!uid) return;
      const [txns, sub] = await Promise.all([
        paymentApi.byStudent(uid).catch(() => []),
        paymentApi.getSubscription(uid).catch(() => null),
      ]);
      setPayments(Array.isArray(txns) ? txns : []);
      setSubscription(sub);
    } finally {
      setLoading(false);
    }
  }

  function handleUpgrade() {
    const plan = PRO_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    openCheckout({
      amount: plan.price,
      name: `EduLearn Pro — ${plan.label}`,
      description: `Pro ${plan.label} Subscription`,
      userEmail: user?.email || '',
      userName:  user?.fullName || user?.name || '',
      onSuccess: async (paymentId) => {
        setProcessing(true);
        try {
          await paymentApi.subscribe({
            studentId: user.userId || user.id,
            plan: plan.id,
            amountPaid: plan.price,
            currency: 'USD',
            paymentId,
            studentEmail: user.email,
            studentName:  user.name || user.fullName || 'Student',
          });
          await loadData(); // refresh subscription status
          alert(`🎉 Welcome to EduLearn Pro (${plan.label})! Enjoy unlimited access.`);
        } catch {
          alert('Payment succeeded but subscription activation failed. Please contact support.');
        } finally {
          setProcessing(false);
        }
      },
      onFailure: (reason) => {
        if (reason !== 'Payment cancelled') alert(`Payment failed: ${reason}`);
      },
    });
  }

  async function handleCancelSubscription() {
    if (!subscription?.subscriptionId) return;
    if (!window.confirm('Cancel your Pro subscription? You will lose access at the end of the billing period.')) return;
    setProcessing(true);
    try {
      await paymentApi.cancelSubscription(subscription.subscriptionId);
      await loadData();
      alert('Subscription cancelled successfully.');
    } catch {
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <Loading label="Loading billing..." />;

  const isPro = subscription?.status === 'ACTIVE';

  return (
    <section className="page-stack">
      {MockModal}
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px' }}>Billing & Payments</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your subscriptions and view your purchase history.</p>
      </div>

      <div className="two-column" style={{ alignItems: 'flex-start' }}>

        {/* ── Left: Plan section ── */}
        <div className="panel">
          {isPro ? (
            /* Active Pro subscriber */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Crown size={28} color="#f5c84c" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px' }}>You're on Pro!</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Plan: <strong>{subscription?.plan}</strong> · Renews: {subscription?.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(245,200,76,.06)', border: '1px solid rgba(245,200,76,.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Access to all 500+ premium courses', '1-on-1 mentorship sessions', 'Downloadable offline content', 'Priority support', 'Certificates of completion'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <CheckCircle2 size={16} color="var(--accent)" /> <span style={{ fontSize: '14px' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="button button-danger" onClick={handleCancelSubscription} disabled={processing}
                style={{ justifyContent: 'center', fontSize: '13px' }}>
                <XCircle size={15} /> {processing ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          ) : (
            /* Free tier — show upgrade options */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px' }}>Upgrade to Pro</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>You are currently on the Free tier. Unlock everything with Pro.</p>
              </div>

              {/* Plan toggle */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {PRO_PLANS.map(plan => (
                  <button key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${selectedPlan === plan.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedPlan === plan.id ? 'rgba(99,102,241,.1)' : 'var(--surface-solid)',
                      cursor: 'pointer', color: 'var(--text-main)', position: 'relative',
                    }}>
                    {plan.badge && (
                      <span style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px' }}>
                        {plan.badge}
                      </span>
                    )}
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{plan.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                      ${plan.price}<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}>{plan.period}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Features of selected plan */}
              {PRO_PLANS.filter(p => p.id === selectedPlan).map(plan => (
                <div key={plan.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <CheckCircle2 size={16} color="var(--primary)" />
                      <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{f}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{plan.description}</p>
                </div>
              ))}

              {/* Pay with Razorpay button */}
              <button className="button button-primary" onClick={handleUpgrade} disabled={processing}
                style={{ justifyContent: 'center', padding: '0 24px', height: '52px', fontSize: '16px', fontWeight: '700' }}>
                <Zap size={18} />
                {processing ? 'Processing...' : `Upgrade to Pro — $${PRO_PLANS.find(p => p.id === selectedPlan)?.price}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                <CreditCard size={14} /> Secured by Razorpay · SSL Encrypted
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Transaction History ── */}
        <div className="panel">
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px' }}>Transaction History</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Your recent course purchases and subscription payments.</p>
            </div>
            <button className="icon-button" title="Refresh" onClick={loadData}>
              <RefreshCw size={16} />
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="state-box" style={{ background: 'transparent', padding: '40px 20px' }}>
              <DollarSign size={36} style={{ color: 'var(--text-muted)', opacity: .4 }} />
              <h3 style={{ marginTop: '12px' }}>No transactions yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Your payment history will appear here after your first purchase.</p>
            </div>
          ) : (
            <div className="list-stack">
              {payments.map((p, i) => (
                <div key={p.paymentId || i} className="list-row"
                  style={{ padding: '14px 16px', background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: p.status === 'SUCCESS' ? 'rgba(16,185,129,.1)' : 'rgba(244,63,94,.1)', display: 'grid', placeItems: 'center', color: p.status === 'SUCCESS' ? 'var(--accent)' : '#f43f5e', flexShrink: 0 }}>
                    {p.status === 'SUCCESS' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.courseName || p.description || `Course #${p.courseId}`}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</span>
                      {p.paymentId && <span style={{ fontFamily: 'monospace' }}>· {p.paymentId}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>
                      {p.currency === 'USD' ? '$' : '₹'}{Number(p.amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: p.status === 'SUCCESS' ? 'var(--accent)' : '#f43f5e', fontWeight: '600' }}>
                      {p.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
