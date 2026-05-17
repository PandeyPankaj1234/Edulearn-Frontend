import { useEffect, useState } from 'react';
import { Users, TrendingUp, CheckCircle2, Search, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseApi, enrollmentApi, progressApi } from '../api/services';
import Loading from '../components/Loading';

export default function InstructorStudents() {
  const { user } = useAuth();
  const [rows, setRows]           = useState([]); // { studentId, name, email, courseTitle, courseId, progressPercent, enrolledAt, status }
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [courses, setCourses]     = useState([]);

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const instructorId = user?.userId || user?.id;
      if (!instructorId) return;

      // 1. Get instructor's courses
      const myCourses = await courseApi.byInstructor(instructorId).catch(() => []);
      setCourses(myCourses);

      if (!myCourses.length) { setRows([]); return; }

      // 2. For each course fetch enrollments
      const allRows = [];
      await Promise.allSettled(myCourses.map(async course => {
        try {
          const enrollments = await enrollmentApi.byCourse(course.courseId).catch(() => []);
          enrollments.forEach(e => {
            const pct = Number(e.progressPercent) || 0;
            allRows.push({
              enrollmentId: e.enrollmentId,
              studentId: e.studentId,
              name: e.studentName || e.fullName || `Student #${e.studentId}`,
              email: e.email || e.studentEmail || '',
              courseTitle: course.title,
              courseId: course.courseId,
              progressPercent: pct,
              enrolledAt: e.enrolledAt || e.createdAt,
              status: pct >= 100 ? 'Completed' : pct > 0 ? 'Active' : 'Not Started',
            });
          });
        } catch {}
      }));

      setRows(allRows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading label="Loading enrolled students..." />;

  const courseOptions = [...new Set(rows.map(r => r.courseTitle))];

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const matchCourse = filterCourse === 'all' || r.courseTitle === filterCourse;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchCourse && matchStatus;
  });

  const totalStudents  = rows.length;
  const completedCount = rows.filter(r => r.status === 'Completed').length;
  const avgProgress    = rows.length ? Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / rows.length) : 0;

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>Enrolled Students</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor progress and activity across all your courses.</p>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { icon: <Users size={24}/>, label: 'Total Students', value: totalStudents, color: 'var(--primary)', bg: 'rgba(99,102,241,.1)' },
          { icon: <CheckCircle2 size={24}/>, label: 'Completions', value: completedCount, color: 'var(--accent)', bg: 'rgba(16,185,129,.1)' },
          { icon: <TrendingUp size={24}/>, label: 'Avg Progress', value: `${avgProgress}%`, color: '#f5c84c', bg: 'rgba(245,200,76,.1)' },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="metric-icon" style={{ color: m.color, background: m.bg }}>{m.icon}</div>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
        </div>
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
          style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <option value="all">All Courses</option>
          {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Not Started">Not Started</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="state-box">
          <Users size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3>No students yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Students will appear here once they enroll in your courses.</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th><th>Course</th><th>Progress</th><th>Enrolled</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students match your filters.</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={`${s.studentId}-${s.courseId}-${i}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        {s.email && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px' }}>{s.courseTitle}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,.08)', borderRadius: '50px', overflow: 'hidden', minWidth: '80px' }}>
                        <div style={{ height: '100%', width: `${s.progressPercent}%`, background: s.progressPercent >= 100 ? 'var(--accent)' : 'var(--primary)', borderRadius: '50px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '36px' }}>{s.progressPercent}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${s.status === 'Completed' ? 'status-active' : s.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      style={s.status === 'Completed' ? { background: 'rgba(99,102,241,.15)', color: 'var(--primary)' } : {}}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
