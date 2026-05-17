import { useEffect, useState } from 'react';
import { PlayCircle, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi, courseApi, progressApi } from '../api/services';

export default function MyLearning() {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.userId) { setLoading(false); return; }
      try {
        const enrollments = await enrollmentApi.byStudent(user.userId).catch(() => []);
        const allProgress = await progressApi.allByStudent(user.userId).catch(() => []);

        const courses = await Promise.all(
          enrollments.map(async (enr) => {
            let course;
            try { course = await courseApi.byId(enr.courseId); }
            catch { course = { courseId: enr.courseId, title: `Course #${enr.courseId}`, thumbnailUrl: null }; }

            // Calculate progress from progress records
            const courseProg = allProgress.filter(p => String(p.courseId) === String(enr.courseId));
            // Use enrollment progressPercent if available, else derive from progress records
            const progress = enr.progressPercent ?? (courseProg.length > 0
              ? Math.round((courseProg.filter(p => p.isCompleted).length / courseProg.length) * 100)
              : 0);

            return {
              enrollmentId: enr.enrollmentId,
              courseId: enr.courseId,
              title: course.title,
              thumbnailUrl: course.thumbnailUrl,
              progress,
            };
          })
        );
        setEnrolled(courses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <Loading label="Loading your courses..." />;

  return (
    <section className="page-stack">
      <div className="topbar">
        <div>
          <h1 style={{ fontSize: '32px' }}>My Learning</h1>
          <p style={{ color: 'var(--text-muted)' }}>Resume your courses and track your progress.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>{enrolled.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enrolled</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>{enrolled.filter(c => c.progress === 100).length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
          </div>
        </div>
      </div>

      {enrolled.length === 0 ? (
        <div className="state-box">
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No courses yet</h3>
          <p>Browse the catalog and enroll in a course to get started.</p>
          <Link to="/courses" className="button button-primary" style={{ marginTop: '16px' }}>Browse Courses</Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrolled.map(course => (
            <article key={course.enrollmentId} className="course-card">
              <div className="course-thumb">
                {course.thumbnailUrl
                  ? <img src={course.thumbnailUrl} alt={course.title} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'grid', placeItems: 'center' }}>
                      <BookOpen size={40} color="rgba(255,255,255,0.6)" />
                    </div>
                }
                {course.progress === 100 && (
                  <div className="badge" style={{ background: 'var(--accent)', position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={13} /> Completed
                  </div>
                )}
              </div>

              <div className="course-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', marginBottom: 'auto', lineHeight: '1.4' }}>{course.title}</h3>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>
                    <span>{course.progress}% Complete</span>
                    <span style={{ color: course.progress === 100 ? 'var(--accent)' : 'var(--primary)' }}>
                      {course.progress === 100 ? 'Done!' : 'In progress'}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{
                      height: '100%',
                      width: `${course.progress}%`,
                      background: course.progress === 100 ? 'var(--accent)' : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  {/* RESUME / REVIEW BUTTON */}
                  <Link
                    to={`/courses/${course.courseId}`}
                    className={`button ${course.progress === 100 ? 'button-secondary' : 'button-primary'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <PlayCircle size={17} />
                    {course.progress === 100 ? 'Review Course' : course.progress > 0 ? 'Resume Learning' : 'Start Learning'}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
