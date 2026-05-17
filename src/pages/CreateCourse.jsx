import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, PlusCircle, Trash2, ChevronRight, GripVertical, Save } from 'lucide-react';
import { courseApi, lessonApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const CATEGORIES = ['Web Development','Data Science','Design','Business','DevOps','Mobile','Security','Other'];
const LEVELS     = ['Beginner','Intermediate','Advanced'];
const LANGUAGES  = ['English','Hindi','Spanish','French','German'];

export default function CreateCourse() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { courseId } = useParams(); // present when editing
  const isEdit = !!courseId;

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    title: '', description: '', category: CATEGORIES[0], level: LEVELS[0],
    price: '', language: LANGUAGES[0], thumbnailUrl: '',
  });

  const [lessons, setLessons] = useState([
    { title: '', contentType: 'video', contentUrl: '', durationMinutes: '', isPreview: false },
  ]);

  // Load existing course + lessons when editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const [c, ls] = await Promise.all([
          courseApi.byId(courseId).catch(() => null),
          lessonApi.byCourse(courseId).catch(() => []),
        ]);
        if (c) {
          setForm({
            title: c.title || '', description: c.description || '',
            category: c.category || CATEGORIES[0], level: c.level || LEVELS[0],
            price: c.price ?? '', language: c.language || LANGUAGES[0],
            thumbnailUrl: c.thumbnailUrl || '',
          });
        }
        if (ls?.length) {
          setLessons(ls.map(l => ({
            lessonId: l.lessonId,
            title: l.title || '', contentType: l.contentType || 'video',
            contentUrl: l.contentUrl || '', durationMinutes: l.durationMinutes || '',
            isPreview: !!l.isPreview, orderIndex: l.orderIndex,
          })));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [courseId, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addLesson    = () => setLessons(p => [...p, { title:'', contentType:'video', contentUrl:'', durationMinutes:'', isPreview:false }]);
  const removeLesson = (i) => setLessons(p => p.filter((_, idx) => idx !== i));
  const setLesson    = (i, k, v) => setLessons(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0, instructorId: user?.userId };
      let savedCourseId = courseId;

      if (isEdit) {
        await courseApi.update(courseId, payload);
      } else {
        const created = await courseApi.create(payload);
        savedCourseId = created?.courseId || created?.id;
      }

      // Save lessons
      if (savedCourseId) {
        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          const lPayload = {
            courseId: savedCourseId,
            title: l.title, contentType: l.contentType,
            contentUrl: l.contentUrl,
            durationMinutes: parseInt(l.durationMinutes) || 0,
            isPreview: l.isPreview, orderIndex: i + 1,
          };
          if (l.lessonId) {
            await lessonApi.update(l.lessonId, lPayload).catch(() => {});
          } else if (l.title) {
            await lessonApi.create(lPayload).catch(() => {});
          }
        }
      }

      navigate('/instructor/courses');
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally { setSubmitting(false); }
  }

  if (loading) return <Loading label="Loading course data..." />;

  const steps = ['Basic Info', 'Curriculum', 'Review'];

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Build and publish your course step by step.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontWeight: '700', fontSize: '14px',
              background: step > i+1 ? 'var(--accent)' : step === i+1 ? 'var(--primary)' : 'var(--surface-solid)',
              color: step >= i+1 ? '#fff' : 'var(--text-muted)',
              border: step === i+1 ? '2px solid var(--primary)' : '2px solid transparent',
            }}>{i+1}</div>
            <span style={{ fontWeight: step === i+1 ? '600' : '400', color: step === i+1 ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '14px' }}>{s}</span>
            {i < steps.length-1 && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="form-section">
            <h3>Course Details</h3>
            <div className="form-group">
              <label>Course Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Mastering React from Scratch" />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea required rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what students will learn..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[['Category', 'category', CATEGORIES], ['Level', 'level', LEVELS], ['Language', 'language', LANGUAGES]].map(([label, key, opts]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <select value={form[key]} onChange={e => set(key, e.target.value)}
                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '12px 16px' }}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="form-group">
                <label>Price (USD)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 for free" />
              </div>
            </div>
            <div className="form-group">
              <label>Thumbnail URL</label>
              <input value={form.thumbnailUrl} onChange={e => set('thumbnailUrl', e.target.value)} placeholder="https://..." />
              {form.thumbnailUrl && (
                <img src={form.thumbnailUrl} alt="preview" style={{ marginTop: '8px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="button button-primary" onClick={() => setStep(2)} disabled={!form.title || !form.description}>
                Next: Curriculum <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Curriculum */}
        {step === 2 && (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '4px' }}>
              <h3 style={{ border: 'none', margin: 0, padding: 0 }}>Course Curriculum</h3>
              <button type="button" className="button button-secondary" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} onClick={addLesson}>
                <PlusCircle size={16} /> Add Lesson
              </button>
            </div>
            <div className="list-stack">
              {lessons.map((lesson, i) => (
                <div key={i} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <GripVertical size={16} /> Lesson {i+1}
                      {lesson.lessonId && <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(16,185,129,.1)', padding: '2px 8px', borderRadius: '50px' }}>saved</span>}
                    </span>
                    {lessons.length > 1 && (
                      <button type="button" className="icon-button" style={{ width: '28px', height: '28px', color: '#f43f5e' }} onClick={() => removeLesson(i)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                    <input placeholder="Lesson title" value={lesson.title} onChange={e => setLesson(i, 'title', e.target.value)} />
                    <select value={lesson.contentType} onChange={e => setLesson(i, 'contentType', e.target.value)}
                      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '10px 12px', width: '120px' }}>
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '12px', alignItems: 'center' }}>
                    <input placeholder="Content URL (video/article/PDF link)" value={lesson.contentUrl} onChange={e => setLesson(i, 'contentUrl', e.target.value)} />
                    <input type="number" placeholder="Minutes" min="0" value={lesson.durationMinutes} onChange={e => setLesson(i, 'durationMinutes', e.target.value)} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={lesson.isPreview} onChange={e => setLesson(i, 'isPreview', e.target.checked)} style={{ width: 'auto' }} />
                      Free Preview
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <button type="button" className="button button-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="button button-primary" onClick={() => setStep(3)}>Next: Review <ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="form-section">
            <h3>Review & {isEdit ? 'Update' : 'Submit'}</h3>
            <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Title', form.title], ['Category', form.category], ['Level', form.level], ['Language', form.language],
                ['Price', form.price ? `$${form.price}` : 'Free'], ['Lessons', `${lessons.filter(l => l.title).length} lessons`]
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              {form.thumbnailUrl && (
                <img src={form.thumbnailUrl} alt="thumbnail" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '8px' }} />
              )}
            </div>
            {error && <p style={{ color: '#f43f5e', fontSize: '14px' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="button button-secondary" onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="button button-primary" disabled={submitting}>
                <Save size={18} /> {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
