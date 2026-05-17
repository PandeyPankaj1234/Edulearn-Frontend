import { useEffect, useState } from 'react';
import { courseApi, enrollmentApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function Enrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await enrollmentApi.byStudent(user.userId);
        
        const enrollmentsWithCourses = await Promise.all(data.map(async (enc) => {
          try {
            const course = await courseApi.byId(enc.courseId);
            return { ...enc, courseTitle: course.title };
          } catch (e) {
            return { ...enc, courseTitle: `Course #${enc.courseId}` };
          }
        }));
        
        setEnrollments(enrollmentsWithCourses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, [user]);

  if (loading) return <Loading label="Loading enrollments" />;

  return (
    <div className="page-container">
      <h2>My Enrollments</h2>
      <p>Manage your active course enrollments.</p>
      <div className="list-container">
        {enrollments.length === 0 ? (
          <p className="empty-state">You are not enrolled in any courses yet.</p>
        ) : (
          enrollments.map((enrollment) => (
            <div key={enrollment.enrollmentId} className="card">
              <h4>{enrollment.courseTitle}</h4>
              <p>Status: {enrollment.status}</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${enrollment.progressPercent || 0}%` }}
                />
              </div>
              <p>{enrollment.progressPercent || 0}% Completed</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
