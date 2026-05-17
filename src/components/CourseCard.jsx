import { Link } from 'react-router-dom';
import { BookOpen, Clock, Signal, Star, Award } from 'lucide-react';
import { minutes } from '../utils/formatters';

export default function CourseCard({ course }) {
  // Use Indian Rupee or Dollar sign based on preference; let's use a generic formatting or USD for this premium look
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `$${price}`;
  };

  return (
    <article className="course-card">
      <div className="course-thumb">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface-hover)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={48} opacity={0.5} />
          </div>
        )}
        <div className="badge">{course.category || 'General'}</div>
      </div>
      <div className="course-card-body">
        <h3>{course.title}</h3>
        <p>{course.description || 'No description added yet. This is a premium course designed to elevate your skills.'}</p>
        
        <div style={{ display: 'flex', gap: '16px', margin: '12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Signal size={14} />{course.level || 'Beginner'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} />{minutes(course.totalDuration || 120)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f5c84c' }}><Star size={14} />4.8</span>
        </div>

        <div className="course-meta">
          <span className="price">{formatPrice(course.price)}</span>
          <Link className="button button-primary" to={`/courses/${course.courseId || course.id || 1}`} style={{ minHeight: '36px', padding: '0 16px', fontSize: '14px' }}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
