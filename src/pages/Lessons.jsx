import { useEffect, useState } from 'react';
import { courseApi, enrollmentApi, lessonApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PlayCircle } from 'lucide-react';
import { minutes } from '../utils/formatters';
import Loading from '../components/Loading';

export default function Lessons() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await enrollmentApi.byStudent(user.userId);
        
        const enrolledCourses = await Promise.all(data.map(async (enc) => {
          try {
            const course = await courseApi.byId(enc.courseId);
            return { courseId: enc.courseId, title: course.title };
          } catch (e) {
            return { courseId: enc.courseId, title: `Course #${enc.courseId}` };
          }
        }));
        
        setCourses(enrolledCourses);
        if (enrolledCourses.length > 0) {
          setSelectedCourseId(enrolledCourses[0].courseId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, [user]);

  useEffect(() => {
    if (!selectedCourseId) return;
    async function fetchLessons() {
      setLessonsLoading(true);
      try {
        const data = await lessonApi.byCourse(selectedCourseId);
        setLessons(data);
      } catch (err) {
        console.error(err);
        setLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    }
    fetchLessons();
  }, [selectedCourseId]);

  if (loading) return <Loading label="Loading courses" />;

  return (
    <section className="page-stack">
      <div className="panel">
        <div className="section-heading compact">
          <h2>Lessons</h2>
          <p>Browse and view lesson contents here.</p>
        </div>
        
        {courses.length === 0 ? (
          <div className="list-container">
            <p className="empty-state">You are not enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="two-column" style={{ marginTop: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select a Course</h3>
              <select 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
                value={selectedCourseId} 
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map(course => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="list-stack">
              <h3 style={{ marginBottom: '1rem', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Lessons ({lessons.length})</h3>
              {lessonsLoading ? <Loading label="Loading lessons" /> : (
                <>
                  {lessons.length ? lessons.map((lesson) => (
                    <div className="list-row" key={lesson.lessonId}>
                      <PlayCircle size={20} />
                      <div>
                        <strong>{lesson.orderIndex}. {lesson.title}</strong>
                        <span>{lesson.contentType || 'content'} · {minutes(lesson.durationMinutes)}</span>
                      </div>
                    </div>
                  )) : <p className="empty-state">No lessons found for this course.</p>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
