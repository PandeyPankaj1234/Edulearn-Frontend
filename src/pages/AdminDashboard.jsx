import { useEffect, useState } from 'react';
import { Users, BookOpen, CreditCard, Activity, TrendingUp, Award, Bell, CheckCircle2 } from 'lucide-react';
import { courseApi, enrollmentApi, paymentApi, authApi, progressApi } from '../api/services';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, revenue: 0, certificates: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, courses, payments, certs] = await Promise.all([
          authApi.getAllUsers().catch(() => []),
          courseApi.all().catch(() => []),
          paymentApi.allPayments().catch(() => []),
          progressApi.allCertificates().catch(() => []),
        ]);
        const revenue = payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + (p.amount || 0), 0);
        setStats({ users: users.length, courses: courses.length, enrollments: 0, revenue, certificates: certs.length });
        setRecentCourses(courses.filter(c => !c.isPublished).slice(0, 5));
        setRecentUsers(users.slice(-5).reverse());
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const metrics = [
    { label: 'Total Users', value: stats.users, icon: <Users size={24}/>, color: 'var(--primary)', bg: 'rgba(99,102,241,.1)', link: '/admin/users' },
    { label: 'Total Courses', value: stats.courses, icon: <BookOpen size={24}/>, color: '#f59e0b', bg: 'rgba(245,158,11,.1)', link: '/admin/courses' },
    { label: 'Total Revenue', value: `$${Number(stats.revenue).toFixed(0)}`, icon: <CreditCard size={24}/>, color: 'var(--accent)', bg: 'rgba(16,185,129,.1)', link: '/admin/payments' },
    { label: 'Certificates Issued', value: stats.certificates, icon: <Award size={24}/>, color: '#a78bfa', bg: 'rgba(167,139,250,.1)', link: '/admin/certificates' },
  ];

  return (
    <div className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Platform-wide operations overview.</p>
      </div>

      <div className="metric-grid">
        {metrics.map(m => (
          <div key={m.label} className="metric" onClick={() => navigate(m.link)} style={{ cursor: 'pointer' }}>
            <div className="metric-icon" style={{ color: m.color, background: m.bg }}>{m.icon}</div>
            <span>{m.label}</span>
            <strong>{loading ? '—' : m.value}</strong>
          </div>
        ))}
      </div>

      <div className="two-column">
        {/* Pending Courses */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px' }}>Unpublished Courses</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Courses awaiting admin review / publication.</p>
            </div>
            {recentCourses.length > 0 && <span className="status-badge status-pending">{recentCourses.length} Pending</span>}
          </div>
          {recentCourses.length === 0 ? (
            <div className="state-box" style={{ background: 'transparent', border: 'none', padding: '20px' }}>
              <CheckCircle2 size={32} color="var(--accent)" /><h3>All caught up!</h3>
            </div>
          ) : (
            <div className="list-stack">
              {recentCourses.map(c => (
                <div key={c.courseId} className="list-row" style={{ padding: '14px', background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 4px' }}>{c.title}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.category} · ${c.price}</span>
                  </div>
                  <button className="button button-primary" style={{ minHeight: '32px', padding: '0 14px', fontSize: '12px' }} onClick={() => navigate('/admin/courses')}>Review</button>
                </div>
              ))}
            </div>
          )}
          <button className="button button-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/admin/courses')}>View All Courses</button>
        </div>

        {/* Recent Users */}
        <div className="panel">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 4px' }}>Recent Registrations</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Newest users on the platform.</p>
          </div>
          <div className="list-stack">
            {recentUsers.map(u => (
              <div key={u.userId} className="list-row" style={{ padding: '14px', background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', fontWeight: '700', flexShrink: 0 }}>
                  {(u.fullName || '?').charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', margin: '0 0 2px' }}>{u.fullName}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.role} · {u.email}</span>
                </div>
                <span className={`status-badge ${u.status === 'Suspended' ? 'status-failed' : 'status-active'}`}>{u.status || 'Active'}</span>
              </div>
            ))}
          </div>
          <button className="button button-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/admin/users')}>View All Users</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="panel">
        <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Manage Users', icon: <Users size={16}/>, path: '/admin/users' },
            { label: 'Course Approvals', icon: <BookOpen size={16}/>, path: '/admin/courses' },
            { label: 'View Payments', icon: <CreditCard size={16}/>, path: '/admin/payments' },
            { label: 'Platform Analytics', icon: <TrendingUp size={16}/>, path: '/admin/analytics' },
            { label: 'All Certificates', icon: <Award size={16}/>, path: '/admin/certificates' },
            { label: 'Send Notification', icon: <Bell size={16}/>, path: '/admin/notifications' },
          ].map(a => (
            <button key={a.label} className="button button-secondary" style={{ flex: '1 1 160px' }} onClick={() => navigate(a.path)}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
