import { useEffect, useState } from 'react';
import { TrendingUp, Users, CheckCircle2, BookOpen, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseApi, enrollmentApi, quizApi } from '../api/services';
import Loading from '../components/Loading';

const Bar = ({ value, color = 'var(--primary)' }) => (
  <div style={{ height: '8px', background: 'rgba(255,255,255,.08)', borderRadius: '50px', overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: '50px', transition: 'width .8s ease' }} />
  </div>
);

export default function InstructorAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState([]);

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const instructorId = user?.userId || user?.id;
      if (!instructorId) return;

      const myCourses = await courseApi.byInstructor(instructorId).catch(() => []);
      if (!myCourses.length) { setCourseStats([]); return; }

      const stats = await Promise.all(myCourses.map(async course => {
        const enrollments = await enrollmentApi.byCourse(course.courseId).catch(() => []);
        const quizzes     = await quizApi.byCourse(course.courseId).catch(() => []);

        const totalStudents   = enrollments.length;
        const percents        = enrollments.map(e => Number(e.progressPercent) || 0);
        const completedCount  = percents.filter(p => p >= 100).length;
        const completionRate  = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
        const avgProgress     = totalStudents > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / totalStudents) : 0;

        // Quiz pass rates from attempts
        let quizPassRate = 0;
        if (quizzes.length) {
          const attemptArrays = await Promise.all(
            quizzes.map(q => quizApi.attemptsByQuiz(q.quizId).catch(() => []))
          );
          const allAttempts = attemptArrays.flat();
          if (allAttempts.length) {
            quizPassRate = Math.round((allAttempts.filter(a => a.passed).length / allAttempts.length) * 100);
          }
        }

        return {
          courseId: course.courseId,
          title: course.title,
          totalStudents,
          completionRate,
          avgProgress,
          quizPassRate,
          quizCount: quizzes.length,
          isPublished: course.isPublished,
        };
      }));

      setCourseStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading label="Loading analytics..." />;

  const totalEnrollments = courseStats.reduce((s, c) => s + c.totalStudents, 0);
  const avgCompletion    = courseStats.length ? Math.round(courseStats.reduce((s, c) => s + c.completionRate, 0) / courseStats.length) : 0;
  const publishedCount   = courseStats.filter(c => c.isPublished).length;

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>Course Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Enrollment trends, completion rates, and quiz performance.</p>
      </div>

      {/* Summary metrics */}
      <div className="metric-grid">
        {[
          { icon: <Users size={24}/>, label: 'Total Enrollments', value: totalEnrollments.toLocaleString(), color: 'var(--primary)', bg: 'rgba(99,102,241,.1)' },
          { icon: <BookOpen size={24}/>, label: 'Published Courses', value: publishedCount, color: 'var(--accent)', bg: 'rgba(16,185,129,.1)' },
          { icon: <CheckCircle2 size={24}/>, label: 'Avg Completion', value: `${avgCompletion}%`, color: '#f5c84c', bg: 'rgba(245,200,76,.1)' },
          { icon: <ClipboardList size={24}/>, label: 'Total Courses', value: courseStats.length, color: 'var(--secondary)', bg: 'rgba(236,72,153,.1)' },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="metric-icon" style={{ color: m.color, background: m.bg }}>{m.icon}</div>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>

      {courseStats.length === 0 ? (
        <div className="state-box">
          <TrendingUp size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3>No data yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create and publish courses to see analytics here.</p>
        </div>
      ) : (
        <div className="list-stack">
          {courseStats.map(course => (
            <div key={course.courseId} className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', margin: 0 }}>{course.title}</h3>
                <span className={`status-badge ${course.isPublished ? 'status-active' : 'status-inactive'}`}>
                  {course.isPublished ? '● Published' : '○ Draft'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Students', value: course.totalStudents, color: 'var(--primary)' },
                  { label: 'Avg Progress', value: `${course.avgProgress}%`, color: 'var(--accent)' },
                  { label: 'Completion Rate', value: `${course.completionRate}%`, color: '#f5c84c' },
                  { label: 'Quiz Pass Rate', value: course.quizCount > 0 ? `${course.quizPassRate}%` : 'No quizzes', color: 'var(--secondary)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--surface-solid)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Completion Rate', value: course.completionRate, color: 'var(--primary)' },
                  { label: 'Avg Progress', value: course.avgProgress, color: 'var(--accent)' },
                  ...(course.quizCount > 0 ? [{ label: 'Quiz Pass Rate', value: course.quizPassRate, color: 'var(--secondary)' }] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '140px', fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                    <Bar value={value} color={color} />
                    <span style={{ fontSize: '13px', fontWeight: '600', width: '40px', textAlign: 'right', color }}>{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
