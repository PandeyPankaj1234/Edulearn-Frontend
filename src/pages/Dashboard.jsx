import { useEffect, useState } from 'react';
import { Award, BookOpen, CreditCard, TrendingUp } from 'lucide-react';
import { courseApi, enrollmentApi, notificationApi, paymentApi, progressApi } from '../api/services';
import CourseCard from '../components/CourseCard';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { currency } from '../utils/formatters';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ courses: [], enrollments: [], certificates: [], unread: 0, revenue: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const courses = await courseApi.featured().catch(() => courseApi.all());
        const enrollments = user?.userId ? await enrollmentApi.byStudent(user.userId).catch(() => []) : [];
        const certificates = user?.userId ? await progressApi.certificates(user.userId).catch(() => []) : [];
        const unread = user?.userId ? await notificationApi.unreadCount(user.userId).catch(() => 0) : 0;
        const revenue = user?.role === 'Instructor' ? await paymentApi.revenue().catch(() => null) : null;
        setData({ courses, enrollments, certificates, unread, revenue });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <Loading label="Loading dashboard" />;

  return (
    <section className="page-stack">
      <div className="metric-grid">
        <div className="metric"><BookOpen /><span>Courses</span><strong>{data.courses.length}</strong></div>
        <div className="metric"><TrendingUp /><span>Enrollments</span><strong>{data.enrollments.length}</strong></div>
        <div className="metric"><Award /><span>Certificates</span><strong>{data.certificates.length}</strong></div>
        <div className="metric"><CreditCard /><span>{data.revenue === null ? 'Unread' : 'Revenue'}</span><strong>{data.revenue === null ? data.unread : currency(data.revenue)}</strong></div>
      </div>

      <div className="section-heading">
        <h2>Featured courses</h2>
        <p>Fresh courses from the backend course service.</p>
      </div>
      {data.courses.length ? (
        <div className="course-grid">{data.courses.slice(0, 3).map((course) => <CourseCard key={course.courseId} course={course} />)}</div>
      ) : (
        <EmptyState title="No courses yet" text="Create or seed courses in the backend to see them here." />
      )}
    </section>
  );
}
