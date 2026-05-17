import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle2, Gift, MessageSquare, BookOpen, CreditCard, ClipboardList, Award, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { notificationApi } from '../api/services';

const TYPE_ICON = {
  ENROLLMENT: { icon: BookOpen, color: 'var(--primary)' },
  PAYMENT: { icon: CreditCard, color: '#10b981' },
  QUIZ_RESULT: { icon: ClipboardList, color: '#f59e0b' },
  CERTIFICATE: { icon: Award, color: 'var(--accent)' },
  COURSE_PUBLISHED: { icon: BookOpen, color: 'var(--secondary)' },
  forum: { icon: MessageSquare, color: '#a78bfa' },
  default: { icon: Bell, color: 'var(--text-muted)' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Demo notifications so the UI is never empty (used when backend returns nothing)
const DEMO = [
  { notificationId: 'd1', type: 'ENROLLMENT', title: 'Enrollment Confirmed', message: 'You have successfully enrolled in "Mastering Full-Stack Development".', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { notificationId: 'd2', type: 'QUIZ_RESULT', title: 'Quiz Graded', message: 'Your quiz "React Fundamentals" was graded. Score: 85/100.', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { notificationId: 'd3', type: 'CERTIFICATE', title: 'Certificate Issued 🎉', message: 'Congratulations! Your certificate for "UI/UX Principles" is ready to download.', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { notificationId: 'd4', type: 'PAYMENT', title: 'Payment Successful', message: 'Payment of $99 for "Advanced Cloud Architecture" was processed successfully.', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

  const uid = user?.userId || user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const data = await notificationApi.byUser(uid).catch(() => []);
      setNotifications(data && data.length > 0 ? data : DEMO);
    } catch {
      setNotifications(DEMO);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (notificationId) => {
    // Optimistic update
    setNotifications(prev => prev.map(n =>
      n.notificationId === notificationId ? { ...n, isRead: true } : n
    ));
    if (!String(notificationId).startsWith('d')) {
      await notificationApi.markRead(notificationId).catch(() => {});
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (uid) {
      await notificationApi.markAllRead(uid).catch(() => {});
    }
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
    if (!String(notificationId).startsWith('d')) {
      await notificationApi.delete(notificationId).catch(() => {});
    }
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <Loading label="Loading notifications..." />;

  return (
    <section className="page-stack">
      <div className="topbar" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-solid)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '13px', textTransform: 'capitalize', background: filter === f ? 'var(--primary)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                {f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>
          <button className="button button-secondary" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCircle2 size={16} /> Mark all read
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <div className="state-box" style={{ padding: '60px' }}>
            <Bell size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <h3 style={{ marginTop: '16px' }}>No notifications</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {filter === 'unread' ? 'No unread notifications.' : 'You have no notifications yet.'}
            </p>
          </div>
        ) : displayed.map((n, idx) => {
          const meta = TYPE_ICON[n.type] || TYPE_ICON.default;
          const Icon = meta.icon;
          return (
            <div
              key={n.notificationId}
              onClick={() => !n.isRead && markRead(n.notificationId)}
              style={{
                padding: '20px 24px',
                borderBottom: idx < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                cursor: n.isRead ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                display: 'grid', placeItems: 'center', color: meta.color,
              }}>
                <Icon size={20} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '15px', margin: 0, fontWeight: n.isRead ? '500' : '700', color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                <p style={{ fontSize: '14px', color: n.isRead ? 'var(--text-muted)' : '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
                  {n.message}
                </p>
                {/* Type badge */}
                <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, padding: '2px 8px', borderRadius: '50px' }}>
                  {(n.type || 'notification').replace('_', ' ')}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {!n.isRead && (
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--primary)' }} title="Unread" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.notificationId); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '4px', opacity: 0.6 }}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
