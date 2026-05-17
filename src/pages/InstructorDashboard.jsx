import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, PlusCircle, ClipboardList, TrendingUp, Eye, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseApi, enrollmentApi, quizApi } from '../api/services';
import Loading from '../components/Loading';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [courses, setCourses]   = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalQuizzes, setTotalQuizzes]   = useState(0);

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const id = user?.userId || user?.id;
      if (!id) return;

      const myCourses = await courseApi.byInstructor(id).catch(() => []);
      setCourses(myCourses);

      // Aggregate enrollments across all courses
      let studentCount = 0;
      let quizCount    = 0;
      await Promise.allSettled(myCourses.map(async c => {
        const [enrs, quizzes] = await Promise.all([
          enrollmentApi.byCourse(c.courseId).catch(() => []),
          quizApi.byCourse(c.courseId).catch(() => []),
        ]);
        studentCount += enrs.length;
        quizCount    += quizzes.length;
      }));

      setTotalStudents(studentCount);
      setTotalQuizzes(quizCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading label="Loading dashboard..." />;

  const publishedCourses = courses.filter(c => c.isPublished);
  const draftCourses     = courses.filter(c => !c.isPublished);

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: '0' }}>
        <div className="section-heading">
          <h2>Instructor Overview</h2>
          <p>Welcome back, {user?.fullName || user?.name || 'Instructor'}! Here's how your courses are performing.</p>
        </div>
        <Link to="/instructor/create" className="button button-primary">
          <PlusCircle size={18} /> Create New Course
        </Link>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--secondary)', background: 'rgba(236,72,153,.1)' }}>
            <Users size={24} />
          </div>
          <span>Total Students</span>
          <strong>{totalStudents.toLocaleString()}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--accent)', background: 'rgba(16,185,129,.1)' }}>
            <BookOpen size={24} />
          </div>
          <span>Published Courses</span>
          <strong>{publishedCourses.length}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,.1)' }}>
            <GraduationCap size={24} />
          </div>
          <span>Draft Courses</span>
          <strong>{draftCourses.length}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon" style={{ color: '#f5c84c', background: 'rgba(245,200,76,.1)' }}>
            <ClipboardList size={24} />
          </div>
          <span>Total Quizzes</span>
          <strong>{totalQuizzes}</strong>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {[
          { to: '/instructor/create',   label: 'Create Course',   icon: <PlusCircle size={20}/>,   color: 'var(--primary)' },
          { to: '/instructor/quizzes',  label: 'Quiz Builder',    icon: <ClipboardList size={20}/>, color: 'var(--secondary)' },
          { to: '/instructor/students', label: 'View Students',   icon: <Users size={20}/>,         color: 'var(--accent)' },
          { to: '/instructor/analytics',label: 'Analytics',       icon: <TrendingUp size={20}/>,    color: '#f5c84c' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-solid)', border: '1px solid var(--border)',
            color: 'var(--text-main)', textDecoration: 'none', fontWeight: '600', fontSize: '14px',
            transition: 'border-color .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = item.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <span style={{ color: item.color }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Course list */}
      <div className="panel">
        <div className="section-heading" style={{ marginBottom: '20px' }}>
          <h2>Your Courses</h2>
          <Link to="/instructor/courses" style={{ fontSize: '13px', color: 'var(--primary)' }}>View all →</Link>
        </div>

        {courses.length === 0 ? (
          <div className="state-box" style={{ background: 'transparent' }}>
            <BookOpen size={36} style={{ color: 'var(--text-muted)', opacity: .4 }} />
            <h3 style={{ marginTop: '12px' }}>No courses yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Start by creating your first course.</p>
            <Link to="/instructor/create" className="button button-primary" style={{ marginTop: '12px' }}>
              <PlusCircle size={16}/> Create Course
            </Link>
          </div>
        ) : (
          <div className="list-stack">
            {courses.slice(0, 5).map(course => (
              <div key={course.courseId} className="list-row"
                style={{ padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--surface-solid)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                {course.thumbnailUrl && (
                  <div style={{ width: '80px', minWidth: '80px', height: '54px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .85 }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${course.isPublished ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '11px' }}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {course.category && <span>{course.category}</span>}
                    {course.level && <span>· {course.level}</span>}
                    <span style={{ color: 'var(--accent)' }}>
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Link to={`/instructor/courses/${course.courseId}/edit`} className="button button-secondary"
                    style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}>
                    Edit
                  </Link>
                  <Link to="/instructor/analytics" className="button button-primary"
                    style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}>
                    <TrendingUp size={13}/> Stats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
