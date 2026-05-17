import { useEffect, useState } from 'react';
import { TrendingUp, Users, BookOpen, DollarSign, Award, RefreshCw } from 'lucide-react';
import { courseApi, enrollmentApi, paymentApi, authApi, progressApi } from '../api/services';
import Loading from '../components/Loading';

const SimpleBar = ({ value, max = 100, color = 'var(--primary)' }) => (
  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '50px', overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: '50px', transition: 'width 0.8s ease' }} />
  </div>
);

export default function AdminAnalytics() {
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState({ users: 0, revenue: 0, courses: 0, certs: 0, enrollments: 0 });
  const [topCourses, setTopCourses] = useState([]);
  const [revenueMonths, setRevenueMonths] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const [users, courses, payments, certs, enrollments] = await Promise.all([
        authApi.getAllUsers().catch(() => []),
        courseApi.all().catch(() => []),
        paymentApi.allPayments().catch(() => []),
        progressApi.allCertificates().catch(() => []),
        enrollmentApi.all().catch(() => []),
      ]);

      const successPayments = payments.filter(p => (p.status || '').toUpperCase() === 'SUCCESS');
      const totalRevenue    = successPayments.reduce((s, p) => s + (p.amount || 0), 0);

      setStats({
        users:       users.length,
        revenue:     totalRevenue,
        courses:     courses.filter(c => c.isPublished).length,
        certs:       certs.length,
        enrollments: enrollments.length,
      });

      // Top courses by enrollment count
      const enrollCountMap = {};
      enrollments.forEach(e => {
        enrollCountMap[e.courseId] = (enrollCountMap[e.courseId] || 0) + 1;
      });
      // Revenue per course
      const revMap = {};
      successPayments.forEach(p => {
        if (p.courseId) revMap[p.courseId] = (revMap[p.courseId] || 0) + (p.amount || 0);
      });

      const top = courses
        .filter(c => c.isPublished)
        .map(c => ({
          courseId:    c.courseId,
          title:       c.title,
          category:    c.category || '—',
          enrollments: enrollCountMap[c.courseId] || 0,
          revenue:     revMap[c.courseId] || 0,
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 8);
      setTopCourses(top);

      // Revenue by month (last 6 months from payments)
      const monthMap = {};
      successPayments.forEach(p => {
        const d = p.paidAt ? new Date(p.paidAt) : null;
        if (!d) return;
        const key = d.toLocaleString('en', { month: 'short', year: '2-digit' });
        monthMap[key] = (monthMap[key] || 0) + (p.amount || 0);
      });
      const months = Object.entries(monthMap)
        .map(([month, revenue]) => ({ month, revenue, enrollments: 0 }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);
      setRevenueMonths(months.length > 0 ? months : [
        { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
        { month: 'Mar', revenue: 0 }, { month: 'Apr', revenue: 0 },
        { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
      ]);
    } catch (err) {
      console.error('Analytics load error:', err);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Loading label="Loading platform analytics..." />;

  const maxRevenue = Math.max(...revenueMonths.map(m => m.revenue), 1);
  const maxEnroll  = Math.max(...topCourses.map(c => c.enrollments), 1);

  const completionRate = stats.enrollments > 0 ? Math.round((stats.certs / stats.enrollments) * 100) : 0;

  return (
    <section className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Platform Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time metrics, top courses, and revenue trends.</p>
        </div>
        <button className="icon-button" onClick={load} title="Refresh"><RefreshCw size={16}/></button>
      </div>

      {/* Key Metrics */}
      <div className="metric-grid">
        {[
          { label: 'Total Users',         value: stats.users.toLocaleString(),             Icon: Users,      color: 'var(--primary)',   bg: 'rgba(99,102,241,.1)' },
          { label: 'Total Revenue',        value: `$${Number(stats.revenue).toFixed(0)}`, Icon: DollarSign, color: 'var(--accent)',    bg: 'rgba(16,185,129,.1)' },
          { label: 'Published Courses',    value: stats.courses.toLocaleString(),           Icon: BookOpen,   color: '#f59e0b',          bg: 'rgba(245,158,11,.1)' },
          { label: 'Certificates Issued',  value: stats.certs.toLocaleString(),             Icon: Award,      color: '#a78bfa',          bg: 'rgba(167,139,250,.1)' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="metric">
            <div className="metric-icon" style={{ color, background: bg }}><Icon size={24}/></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="two-column">
        {/* Revenue Bar Chart */}
        <div className="panel">
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Monthly Revenue</h2>
          {revenueMonths.every(m => m.revenue === 0) ? (
            <div className="state-box" style={{ background: 'transparent', border: 'none', padding: '20px' }}>
              <DollarSign size={32} style={{ opacity: .3 }}/>
              <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '14px' }}>No payment data yet. Revenue will appear here as students purchase courses.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
              {revenueMonths.map(m => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {m.revenue >= 1000 ? `$${(m.revenue/1000).toFixed(0)}k` : `$${m.revenue}`}
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${(m.revenue / maxRevenue) * 100}%`,
                    background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '4px',
                    opacity: 0.85,
                    transition: 'height 0.8s ease',
                  }}/>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Health */}
        <div className="panel">
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Platform Health</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Certificate / Completion Rate', value: completionRate, color: 'var(--primary)' },
              { label: 'Published Courses', value: stats.courses > 0 ? Math.min(Math.round((stats.courses / Math.max(stats.courses, 1)) * 100), 100) : 0, color: 'var(--accent)', display: `${stats.courses} published` },
              { label: 'Total Enrollments', value: Math.min(stats.enrollments, 100), color: 'var(--secondary)', display: `${stats.enrollments} total` },
              { label: 'System Uptime', value: 99.9, color: '#f59e0b' },
            ].map(({ label, value, color, display }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ minWidth: '200px', fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                <SimpleBar value={value} color={color} />
                <span style={{ fontSize: '13px', fontWeight: '700', color, minWidth: '60px', textAlign: 'right' }}>
                  {display || `${value}%`}
                </span>
              </div>
            ))}
          </div>

          {/* Quick numbers */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Total Enrollments', value: stats.enrollments },
              { label: 'Avg Revenue/Course', value: stats.courses > 0 ? `$${Math.round(stats.revenue / stats.courses)}` : '$0' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-solid)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Courses */}
      <div className="panel">
        <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Top Performing Courses</h2>
        {topCourses.length === 0 ? (
          <div className="state-box" style={{ background: 'transparent', border: 'none' }}>
            <BookOpen size={32} style={{ opacity: .3 }}/>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '14px' }}>No published courses yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Enrollments</th>
                  <th style={{ minWidth: '180px' }}>Enrollment Share</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((c, i) => (
                  <tr key={c.courseId}>
                    <td style={{ fontWeight: '700', color: i < 3 ? 'var(--primary)' : 'var(--text-muted)', width: '32px' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td style={{ fontWeight: '500', maxWidth: '200px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.category}</td>
                    <td style={{ fontWeight: '600' }}>{c.enrollments.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SimpleBar value={c.enrollments} max={maxEnroll} color="var(--primary)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '30px' }}>
                          {maxEnroll > 0 ? `${Math.round((c.enrollments / maxEnroll) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>
                      {c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : '—'}
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
