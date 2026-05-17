import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Eye, EyeOff, Trash2, PlusCircle, Edit3, Search, Star, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { courseApi } from '../api/services';
import Loading from '../components/Loading';

export default function InstructorCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // courseId being actioned

  useEffect(() => {
    loadCourses();
  }, [user]);

  async function loadCourses() {
    setLoading(true);
    try {
      const instructorId = user?.userId || user?.id;
      if (!instructorId) return;
      const data = await courseApi.byInstructor(instructorId).catch(() => []);
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(courseId) {
    setActionLoading(courseId);
    try {
      const updated = await courseApi.submitForReview(courseId);
      setCourses(prev => prev.map(c => c.courseId === courseId ? updated : c));
    } catch {
      alert('Failed to submit for review. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(courseId) {
    if (!window.confirm('Delete this course permanently? This cannot be undone.')) return;
    setActionLoading(courseId);
    try {
      await courseApi.delete(courseId);
      setCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch {
      alert('Failed to delete course. It may have active enrollments.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <Loading label="Loading your courses..." />;

  const filtered = courses.filter(c => {
    const matchSearch = (c.title || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'
      || (filter === 'published' && c.isPublished)
      || (filter === 'draft' && !c.isPublished);
    return matchSearch && matchFilter;
  });

  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount = courses.filter(c => !c.isPublished).length;

  return (
    <section className="page-stack">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>My Courses</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {courses.length} courses · {publishedCount} published · {draftCount} drafts
          </p>
        </div>
        <Link to="/instructor/create" className="button button-primary">
          <PlusCircle size={18} /> Create Course
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ width: '170px', background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <option value="all">All Courses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="state-box">
          <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3>{courses.length === 0 ? 'No courses yet' : 'No results found'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {courses.length === 0 ? 'Create your first course to get started.' : 'Try a different search or filter.'}
          </p>
          {courses.length === 0 && (
            <Link to="/instructor/create" className="button button-primary" style={{ marginTop: '12px' }}>
              <PlusCircle size={18} /> Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className="list-stack">
          {filtered.map(course => {
            const busy = actionLoading === course.courseId;
            return (
              <div key={course.courseId} className="panel"
                style={{ display: 'flex', gap: '20px', padding: '20px', alignItems: 'center' }}>
                {/* Thumbnail */}
                <div style={{ width: '130px', minWidth: '130px', height: '88px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-solid)', flexShrink: 0 }}>
                  {course.thumbnailUrl
                    ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                    : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><BookOpen size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h3 style={{ fontSize: '17px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {course.title}
                    </h3>
                    <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--accent)', flexShrink: 0 }}>
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${course.isPublished ? 'status-active' : 'status-inactive'}`}>
                      {course.isPublished ? '● Published' : '○ Draft'}
                    </span>
                    {course.approvalStatus && course.approvalStatus !== 'Draft' && (
                      <span className={`status-badge ${
                        course.approvalStatus === 'Approved' ? 'status-active' :
                        course.approvalStatus === 'Rejected' ? 'status-failed' : 'status-pending'
                      }`}>
                        {course.approvalStatus === 'PendingReview' ? '⏳ Under Review' :
                         course.approvalStatus === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    )}
                    {course.level && <span className="status-badge status-pending">{course.level}</span>}
                    {course.category && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{course.category}</span>}
                    {course.language && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>· {course.language}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span><GraduationCap size={12} style={{ verticalAlign: 'middle' }} /> {course.totalDuration || 0} min total</span>
                    {course.createdAt && <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                  <Link to={`/instructor/courses/${course.courseId}/edit`} className="button button-secondary"
                    style={{ justifyContent: 'center', minHeight: '36px', padding: '0 14px', fontSize: '13px' }}>
                    <Edit3 size={14} /> Edit
                  </Link>
                  {/* Submit for Review / status button */}
                  {(!course.isPublished && course.approvalStatus !== 'PendingReview') ? (
                    <button
                      className="button button-success"
                      style={{ justifyContent: 'center', minHeight: '36px', padding: '0 14px', fontSize: '13px' }}
                      onClick={() => handleSubmitReview(course.courseId)}
                      disabled={busy}>
                      <Eye size={14} />
                      {busy ? '...' : 'Submit for Review'}
                    </button>
                  ) : course.approvalStatus === 'PendingReview' ? (
                    <button className="button button-secondary" disabled
                      style={{ justifyContent: 'center', minHeight: '36px', padding: '0 14px', fontSize: '13px', opacity: 0.7 }}>
                      ⏳ Under Review
                    </button>
                  ) : null}
                  <button className="button button-danger"
                    style={{ justifyContent: 'center', minHeight: '36px', padding: '0 14px', fontSize: '13px' }}
                    onClick={() => handleDelete(course.courseId)}
                    disabled={busy}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
