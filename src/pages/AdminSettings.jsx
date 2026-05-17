import { useState } from 'react';
import { Settings, Bell, Shield, Globe, Database, Save, ChevronRight } from 'lucide-react';

const MENU = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'platform', label: 'Platform', icon: Globe },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    platformName: 'EduLearn', tagline: 'Learn Anytime. Grow Everywhere.',
    supportEmail: 'support@edulearn.com', maxFileUploadMb: 500,
    maintenanceMode: false, allowGuestBrowsing: true,
  });

  const [notifSettings, setNotifSettings] = useState({
    emailOnEnrollment: true, emailOnPayment: true, emailOnCertificate: true,
    emailOnQuizResult: false, emailOnNewCourse: false,
  });

  const [security, setSecurity] = useState({
    jwtExpiryHours: 24, requireEmailVerification: true,
    allowOAuth: true, maxLoginAttempts: 5,
  });

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const ToggleSwitch = ({ value, onChange, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: '48px', height: '26px', borderRadius: '50px', border: 'none', cursor: 'pointer',
          background: value ? 'var(--accent)' : 'var(--surface-solid)',
          position: 'relative', transition: 'all 0.3s',
        }}
      >
        <span style={{
          position: 'absolute', top: '3px', left: value ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.3s',
        }} />
      </button>
    </div>
  );

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>Platform Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure global platform behaviour and preferences.</p>
      </div>

      <div className="two-column" style={{ alignItems: 'flex-start' }}>
        {/* Sidebar Menu */}
        <div className="panel" style={{ padding: '8px' }}>
          {MENU.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === key ? '600' : '400',
                background: activeTab === key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === key ? 'var(--primary-light)' : 'var(--text-muted)',
                transition: 'all 0.2s',
                borderLeft: activeTab === key ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: activeTab === key ? 1 : 0 }} />
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <form className="form-section" onSubmit={handleSave}>
          {activeTab === 'general' && (
            <>
              <h3>General Settings</h3>
              {[
                { label: 'Platform Name', key: 'platformName', type: 'text' },
                { label: 'Tagline', key: 'tagline', type: 'text' },
                { label: 'Support Email', key: 'supportEmail', type: 'email' },
                { label: 'Max File Upload (MB)', key: 'maxFileUploadMb', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input type={type} value={general[key]} onChange={e => setGeneral(g => ({ ...g, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--surface-solid)', borderRadius: 'var(--radius-md)' }}>
                <ToggleSwitch label="Maintenance Mode" value={general.maintenanceMode} onChange={v => setGeneral(g => ({ ...g, maintenanceMode: v }))} />
                <ToggleSwitch label="Allow Guest Browsing" value={general.allowGuestBrowsing} onChange={v => setGeneral(g => ({ ...g, allowGuestBrowsing: v }))} />
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h3>Email Notification Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--surface-solid)', borderRadius: 'var(--radius-md)' }}>
                <ToggleSwitch label="Send email on Enrollment" value={notifSettings.emailOnEnrollment} onChange={v => setNotifSettings(n => ({ ...n, emailOnEnrollment: v }))} />
                <ToggleSwitch label="Send email on Payment" value={notifSettings.emailOnPayment} onChange={v => setNotifSettings(n => ({ ...n, emailOnPayment: v }))} />
                <ToggleSwitch label="Send email on Certificate Issued" value={notifSettings.emailOnCertificate} onChange={v => setNotifSettings(n => ({ ...n, emailOnCertificate: v }))} />
                <ToggleSwitch label="Send email on Quiz Result" value={notifSettings.emailOnQuizResult} onChange={v => setNotifSettings(n => ({ ...n, emailOnQuizResult: v }))} />
                <ToggleSwitch label="Send email on New Course Published" value={notifSettings.emailOnNewCourse} onChange={v => setNotifSettings(n => ({ ...n, emailOnNewCourse: v }))} />
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h3>Security Settings</h3>
              <div className="form-group">
                <label>JWT Token Expiry (hours)</label>
                <input type="number" min="1" max="168" value={security.jwtExpiryHours} onChange={e => setSecurity(s => ({ ...s, jwtExpiryHours: parseInt(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Max Login Attempts</label>
                <input type="number" min="3" max="20" value={security.maxLoginAttempts} onChange={e => setSecurity(s => ({ ...s, maxLoginAttempts: parseInt(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--surface-solid)', borderRadius: 'var(--radius-md)' }}>
                <ToggleSwitch label="Require Email Verification on Register" value={security.requireEmailVerification} onChange={v => setSecurity(s => ({ ...s, requireEmailVerification: v }))} />
                <ToggleSwitch label="Allow OAuth Login (Google, GitHub)" value={security.allowOAuth} onChange={v => setSecurity(s => ({ ...s, allowOAuth: v }))} />
              </div>
            </>
          )}

          {activeTab === 'platform' && (
            <>
              <h3>Platform Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'API Version', value: 'v1.0.0' },
                  { label: 'Database', value: 'MySQL 8.0' },
                  { label: 'Search Engine', value: 'Elasticsearch 8.x' },
                  { label: 'CDN Provider', value: 'AWS CloudFront' },
                  { label: 'Storage', value: 'AWS S3' },
                  { label: 'Message Broker', value: 'RabbitMQ 3.x' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-solid)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'monospace', color: 'var(--accent)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {saved && <span style={{ color: 'var(--accent)', fontSize: '14px', alignSelf: 'center' }}>✓ Settings saved!</span>}
            <button type="submit" className="button button-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
