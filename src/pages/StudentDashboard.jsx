import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock, CheckCircle, Trophy, ClipboardList, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi, courseApi, progressApi } from '../api/services';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recentCourses, setRecentCourses] = useState([]);
  const [stats, setStats] = useState({ inProgress: 0, completed: 0, hours: 0, certificates: 0 });

  useEffect(() => {
    if (!user?.userId) return;
    async function load() {
      try {
        const enrollments = await enrollmentApi.byStudent(user.userId).catch(() => []);
        const allProgress = await progressApi.allByStudent(user.userId).catch(() => []);
        const certs = await progressApi.certificates(user.userId).catch(() => []);

        const courses = await Promise.all(
          enrollments.slice(0, 4).map(async (enr) => {
            let course;
            try { course = await courseApi.byId(enr.courseId); }
            catch { course = { courseId: enr.courseId, title: `Course #${enr.courseId}` }; }
            const prog = allProgress.filter(p => String(p.courseId) === String(enr.courseId));
            const progress = enr.progressPercent ??
              (prog.length ? Math.round((prog.filter(p => p.isCompleted).length / prog.length) * 100) : 0);
            const lastLesson = prog.sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))[0];
            return { courseId: enr.courseId, title: course.title, progress, lastWatched: lastLesson ? `Lesson #${lastLesson.lessonId}` : 'Not started' };
          })
        );

        setRecentCourses(courses);
        const totalWatchedSeconds = allProgress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0);
        setStats({
          inProgress: enrollments.filter((_, i) => (courses[i]?.progress ?? 0) < 100).length,
          completed: enrollments.filter((_, i) => (courses[i]?.progress ?? 0) === 100).length,
          hours: Math.round(totalWatchedSeconds / 3600),
          certificates: certs.length,
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [user]);

  return (
    <div className="page-stack">
      <div className="metric-grid">
        <div className="metric">
          <div className="metric-icon"><PlayCircle size={24} /></div>
          <span>Courses in Progress</span>
          <strong>{stats.inProgress}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon"><CheckCircle size={24} /></div>
          <span>Completed Courses</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="metric">
          <div className="metric-icon"><Clock size={24} /></div>
          <span>Learning Hours</span>
          <strong>{stats.hours}h</strong>
        </div>
        <div className="metric">
          <div className="metric-icon"><Trophy size={24} /></div>
          <span>Certificates Earned</span>
          <strong>{stats.certificates}</strong>
        </div>
      </div>

      <div className="two-column">
        <div className="panel">
          <div className="section-heading" style={{ marginBottom: '20px' }}>
            <h2>Continue Learning</h2>
            <p>Pick up where you left off</p>
          </div>
          <div className="list-stack">
            {recentCourses.length === 0 ? (
              <div className="state-box" style={{ background: 'var(--surface-solid)', border: '1px dashed var(--border)' }}>
                <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '14px' }}>No courses yet. <Link to="/courses">Browse courses →</Link></p>
              </div>
            ) : recentCourses.map(course => (
              <div key={course.courseId} className="list-row" style={{ padding: '16px', border: '1px solid var(--border)', background: 'var(--surface-solid)' }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.15)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <PlayCircle size={26} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Next up: {course.lastWatched}</span>
                  <div style={{ marginTop: '10px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? 'var(--accent)' : 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '12px', marginTop: '4px', display: 'block', color: 'var(--text-muted)' }}>{course.progress}% completed</span>
                </div>
                {/* ✅ FIXED: correct route /courses/:courseId — no /learn suffix */}
                <Link to={`/courses/${course.courseId}`} className="button button-primary" style={{ flexShrink: 0 }}>
                  {course.progress === 100 ? 'Review' : course.progress > 0 ? 'Resume' : 'Start'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading" style={{ marginBottom: '20px' }}>
            <h2>Upcoming Quizzes</h2>
            <p>Assessments due soon</p>
          </div>
          <div className="state-box" style={{ background: 'var(--surface-solid)', border: '1px dashed var(--border)' }}>
            <ClipboardList size={32} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ marginTop: '16px' }}>You're all caught up!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No pending quizzes at the moment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
