import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, XCircle, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { courseApi } from '../api/services';
import Loading from '../components/Loading';

const STATUS_COLORS = {
  Draft:         { color: '#94a3b8', bg: 'rgba(148,163,184,.12)' },
  PendingReview: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  Approved:      { color: '#10b981', bg: 'rgba(16,185,129,.12)' },
  Rejected:      { color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
};

export default function AdminCourses() {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('PendingReview');
  const [actionId, setActionId]     = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { courseId, title }
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await courseApi.all();
      setAllCourses(Array.isArray(data) ? data : []);
    } catch { setAllCourses([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(courseId) {
    setActionId(courseId);
    try {
      const updated = await courseApi.approveCourse(courseId);
      setAllCourses(prev => prev.map(c => c.courseId === courseId ? updated : c));
    } catch { alert('Failed to approve course.'); }
    setActionId(null);
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return;
    const { courseId } = rejectModal;
    setActionId(courseId);
    try {
      const updated = await courseApi.rejectCourse(courseId, rejectReason || 'Does not meet quality standards');
      setAllCourses(prev => prev.map(c => c.courseId === courseId ? updated : c));
    } catch { alert('Failed to reject course.'); }
    setRejectModal(null);
    setRejectReason('');
    setActionId(null);
  }

  async function handleDelete(courseId) {
    if (!window.confirm('Permanently delete this course?')) return;
    setActionId(courseId);
    try {
      await courseApi.delete(courseId);
      setAllCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch { alert('Failed to delete course.'); }
    setActionId(null);
  }

  if (loading) return <Loading label="Loading courses..." />;

  const byStatus = (s) => allCourses.filter(c => (c.approvalStatus || 'Draft') === s);
  const pending  = byStatus('PendingReview');
  const approved = byStatus('Approved');
  const rejected = byStatus('Rejected');
  const draft    = byStatus('Draft');

  const tabs = [
    { key: 'PendingReview', label: `Pending Review (${pending.length})`,  icon: <Clock size={14}/> },
    { key: 'Approved',      label: `Approved (${approved.length})`,        icon: <CheckCircle2 size={14}/> },
    { key: 'Rejected',      label: `Rejected (${rejected.length})`,        icon: <XCircle size={14}/> },
    { key: 'Draft',         label: `Drafts (${draft.length})`,             icon: <AlertCircle size={14}/> },
  ];

  const shown = byStatus(tab);

  return (
    <section className="page-stack">
      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '460px', maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: '8px' }}>Reject Course</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Rejecting: <strong>{rejectModal.title}</strong>
            </p>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Rejection Reason (shown to instructor)
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Content quality insufficient, missing prerequisites..."
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="button button-ghost" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button className="button button-danger" onClick={handleRejectConfirm}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Course Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review, approve, or reject courses submitted by instructors.</p>
        </div>
        <button className="icon-button" onClick={load}><RefreshCw size={16}/></button>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Courses',   value: allCourses.length, color: 'var(--primary)',  bg: 'rgba(99,102,241,.1)' },
          { label: 'Pending Review',  value: pending.length,    color: '#f59e0b',         bg: 'rgba(245,158,11,.1)' },
          { label: 'Approved',        value: approved.length,   color: 'var(--accent)',   bg: 'rgba(16,185,129,.1)' },
          { label: 'Rejected',        value: rejected.length,   color: '#ef4444',         bg: 'rgba(239,68,68,.1)' },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="metric-icon" style={{ color: m.color, background: m.bg }}><BookOpen size={24}/></div>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-solid)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', background: tab === key ? 'var(--primary)' : 'transparent', color: tab === key ? '#fff' : 'var(--text-muted)' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="panel">
        {shown.length === 0 ? (
          <div className="state-box" style={{ background: 'transparent', border: 'none' }}>
            <CheckCircle2 size={36} style={{ color: 'var(--accent)' }} />
            <h3>No courses in this category.</h3>
          </div>
        ) : (
          <div className="list-stack">
            {shown.map(course => {
              const st = STATUS_COLORS[course.approvalStatus] || STATUS_COLORS.Draft;
              return (
                <div key={course.courseId} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', flexWrap: 'wrap' }}>
                  {course.thumbnailUrl && (
                    <img src={course.thumbnailUrl} alt={course.title} style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', margin: 0 }}>{course.title}</h3>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', color: st.color, background: st.bg }}>
                        {course.approvalStatus || 'Draft'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>{course.category}</span><span>·</span>
                      <span>{course.level}</span><span>·</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '700' }}>₹{course.price}</span>
                      {course.language && <><span>·</span><span>{course.language}</span></>}
                    </div>
                    {course.rejectionReason && (
                      <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', fontStyle: 'italic' }}>
                        Reason: {course.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    {course.approvalStatus === 'PendingReview' && (
                      <>
                        <button className="button button-success" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} disabled={actionId === course.courseId} onClick={() => handleApprove(course.courseId)}>
                          <CheckCircle2 size={14}/> Approve
                        </button>
                        <button className="button button-danger" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} disabled={actionId === course.courseId} onClick={() => setRejectModal({ courseId: course.courseId, title: course.title })}>
                          <XCircle size={14}/> Reject
                        </button>
                      </>
                    )}
                    {course.approvalStatus === 'Rejected' && (
                      <button className="button button-success" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} disabled={actionId === course.courseId} onClick={() => handleApprove(course.courseId)}>
                        <CheckCircle2 size={14}/> Approve Now
                      </button>
                    )}
                    <button className="button button-ghost" style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }} disabled={actionId === course.courseId} onClick={() => handleDelete(course.courseId)}>
                      <XCircle size={14}/> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
