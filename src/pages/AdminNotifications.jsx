import { useEffect, useState } from 'react';
import { Bell, Send, Users, GraduationCap, Shield, CheckCircle2 } from 'lucide-react';
import { notificationApi, authApi } from '../api/services';
import Loading from '../components/Loading';

const TARGETS = [
  { key: 'all',        label: 'All Users',    icon: <Users size={16}/> },
  { key: 'Student',    label: 'All Students', icon: <GraduationCap size={16}/> },
  { key: 'Instructor', label: 'All Instructors', icon: <Shield size={16}/> },
];

const NOTIFICATION_TYPES = [
  'ANNOUNCEMENT', 'COURSE_UPDATE', 'MAINTENANCE', 'PROMOTION', 'REMINDER',
];

export default function AdminNotifications() {
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [allUsers, setAllUsers]   = useState([]);
  const [recent, setRecent]       = useState([]);

  const [form, setForm] = useState({ target: 'all', type: 'ANNOUNCEMENT', title: '', message: '' });

  useEffect(() => {
    async function load() {
      try {
        const [users, notifs] = await Promise.all([
          authApi.getAllUsers().catch(() => []),
          notificationApi.all().catch(() => []),
        ]);
        setAllUsers(Array.isArray(users) ? users : []);
        setRecent(Array.isArray(notifs) ? notifs.slice(0, 20) : []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true); setSent(false);
    try {
      // Get target user IDs
      let targets = allUsers;
      if (form.target !== 'all') {
        targets = allUsers.filter(u => u.role === form.target);
      }

      await notificationApi.sendBulk({
        userIds: targets.map(u => u.userId),
        recipientEmails: targets.map(u => u.email).filter(Boolean),
        type:    form.type,
        title:   form.title,
        message: form.message,
      });

      setSent(true);
      setForm(f => ({ ...f, title: '', message: '' }));
      // Refresh recent
      const notifs = await notificationApi.all().catch(() => []);
      setRecent(Array.isArray(notifs) ? notifs.slice(0, 20) : []);
    } catch (err) {
      alert('Failed to send notification. Please try again.');
    }
    setSending(false);
  }

  if (loading) return <Loading label="Loading notifications..." />;

  const targetCount = form.target === 'all' ? allUsers.length : allUsers.filter(u => u.role === form.target).length;

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>Platform Notifications</h1>
        <p style={{ color: 'var(--text-muted)' }}>Send announcements and alerts to all users or specific groups.</p>
      </div>

      <div className="two-column" style={{ alignItems: 'flex-start' }}>

        {/* Send Form */}
        <div className="panel">
          <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--primary)"/> Compose Notification
          </h2>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Target */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Target Audience</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {TARGETS.map(t => (
                  <button key={t.key} type="button"
                    onClick={() => setForm(f => ({ ...f, target: t.key }))}
                    style={{ flex: '1 1 120px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.target === t.key ? 'var(--primary)' : 'var(--border)'}`, background: form.target === t.key ? 'rgba(99,102,241,.1)' : 'var(--surface-solid)', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: form.target === t.key ? '700' : '400', fontSize: '13px' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Will send to <strong>{targetCount}</strong> user{targetCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Type */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Notification Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '8px' }}>
                {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>

            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Title</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Platform Maintenance on May 20th" style={{ marginTop: '8px' }} />
            </div>

            {/* Message */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Message</label>
              <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your notification message here..." rows={5}
                style={{ marginTop: '8px', resize: 'vertical', minHeight: '120px' }} />
            </div>

            {sent && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: '600' }}>
                <CheckCircle2 size={18}/> Notification sent successfully to {targetCount} users!
              </div>
            )}

            <button type="submit" className="button button-primary" disabled={sending}
              style={{ justifyContent: 'center', height: '48px', fontSize: '15px', fontWeight: '700' }}>
              <Send size={16}/> {sending ? 'Sending…' : `Send to ${targetCount} Users`}
            </button>
          </form>
        </div>

        {/* Recent Notifications */}
        <div className="panel">
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Recent Notifications</h2>
          {recent.length === 0 ? (
            <div className="state-box" style={{ background: 'transparent', border: 'none' }}>
              <Bell size={32} style={{ color: 'var(--text-muted)', opacity: .4 }} />
              <h3>No notifications sent yet</h3>
            </div>
          ) : (
            <div className="list-stack">
              {recent.map((n, i) => (
                <div key={n.notificationId || i} style={{ padding: '14px 16px', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', margin: '0 0 4px' }}>{n.title}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px' }}>{n.message}</p>
                    </div>
                    <span className="status-badge status-pending" style={{ flexShrink: 0, fontSize: '10px' }}>{n.type || 'NOTIFICATION'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
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
