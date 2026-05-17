import { useState } from 'react';
import { CreditCard, Lock, CheckCircle2, X } from 'lucide-react';

// ── Mock Payment Modal (shown when Razorpay key is invalid / not set) ──────────
function MockPaymentModal({ amount, name, userEmail, userName, onSuccess, onClose }) {
  const [card, setCard]     = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv]       = useState('');
  const [name_, setName_]   = useState(userName || '');
  const [paying, setPaying] = useState(false);
  const [done, setDone]     = useState(false);

  // Format card number with spaces
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  // Format expiry MM/YY
  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  async function handlePay(e) {
    e.preventDefault();
    setPaying(true);
    // Simulate 1.5s processing delay
    await new Promise(r => setTimeout(r, 1500));
    setDone(true);
    await new Promise(r => setTimeout(r, 800));
    const mockPaymentId = `pay_MOCK_${Date.now()}`;
    onSuccess(mockPaymentId);
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,rgba(99,102,241,.15),rgba(236,72,153,.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
              <CreditCard size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>Secure Checkout</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EduLearn · SSL Encrypted</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Amount */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{name}</span>
          <span style={{ fontWeight: '800', fontSize: '22px', color: 'var(--primary)' }}>₹{Math.round(amount * 83).toLocaleString()}</span>
        </div>

        {done ? (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <CheckCircle2 size={56} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '20px' }}>Payment Successful!</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Enrolling you in the course…</p>
          </div>
        ) : (
          <form onSubmit={handlePay} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cardholder name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Cardholder Name</label>
              <input required value={name_} onChange={e => setName_(e.target.value)} placeholder="John Doe" />
            </div>

            {/* Card number */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Card Number</label>
              <div style={{ position: 'relative' }}>
                <input required value={card} onChange={e => setCard(fmtCard(e.target.value))}
                  placeholder="4111 1111 1111 1111" maxLength={19} inputMode="numeric"
                  style={{ paddingRight: '44px' }} />
                <CreditCard size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Expiry (MM/YY)</label>
                <input required value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))}
                  placeholder="12/26" maxLength={5} inputMode="numeric" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>CVV</label>
                <input required value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                  placeholder="123" maxLength={4} inputMode="numeric" type="password" />
              </div>
            </div>

            {/* Pay button */}
            <button type="submit" className="button button-primary" disabled={paying}
              style={{ justifyContent: 'center', height: '52px', fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>
              {paying ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Processing…
                </span>
              ) : (
                <><Lock size={16} /> Pay ₹{Math.round(amount * 83).toLocaleString()}</>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Lock size={12} /> 256-bit SSL · Your card data is never stored
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── useRazorpay hook ──────────────────────────────────────────────────────────
export function useRazorpay() {
  const [mockOpts, setMockOpts] = useState(null);

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function openCheckout({ amount, name, description, userEmail, userName, onSuccess, onFailure }) {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    const isPlaceholder = !key || key.includes('YourKeyHere') || key.length < 20;

    // ── If no valid key → show built-in mock payment modal ──
    if (isPlaceholder) {
      setMockOpts({ amount, name, userEmail, userName, onSuccess, onFailure });
      return;
    }

    // ── Real Razorpay flow ──
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      // Fallback to mock if script fails to load
      setMockOpts({ amount, name, userEmail, userName, onSuccess, onFailure });
      return;
    }

    let paymentSucceeded = false;
    const amountInPaise  = Math.round(amount * 83 * 100);

    const options = {
      key,
      amount: amountInPaise,
      currency: 'INR',
      name: 'EduLearn',
      description: description || name,
      prefill: { name: userName || '', email: userEmail || '' },
      theme: { color: '#6366f1' },
      handler(response) {
        paymentSucceeded = true;
        onSuccess?.(response.razorpay_payment_id);
      },
      modal: {
        ondismiss() {
          if (!paymentSucceeded) onFailure?.('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      if (!paymentSucceeded) {
        onFailure?.(resp?.error?.description || 'Payment failed');
      }
    });
    rzp.open();
  }

  // Render the mock modal if active
  const MockModal = mockOpts ? (
    <MockPaymentModal
      amount={mockOpts.amount}
      name={mockOpts.name}
      userEmail={mockOpts.userEmail}
      userName={mockOpts.userName}
      onSuccess={(payId) => { setMockOpts(null); mockOpts.onSuccess?.(payId); }}
      onClose={() => { setMockOpts(null); mockOpts.onFailure?.('Payment cancelled'); }}
    />
  ) : null;

  return { openCheckout, MockModal };
}
