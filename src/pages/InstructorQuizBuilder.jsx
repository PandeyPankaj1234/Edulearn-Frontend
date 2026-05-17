import { useEffect, useState } from 'react';
import { courseApi, quizApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, CheckCircle2, ClipboardList, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import Loading from '../components/Loading';

const emptyQuiz = () => ({
  title: '', description: '', timeLimitMinutes: 15, passingScore: 70, maxAttempts: 3,
  questions: [emptyQuestion()],
});
const emptyQuestion = () => ({
  text: '', type: 'MCQ', correctAnswer: '', marks: 1,
  options: ['', '', '', ''],
});

export default function InstructorQuizBuilder() {
  const { user } = useAuth();
  const [courses, setCourses]       = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [quiz, setQuiz]             = useState(emptyQuiz());
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => { loadCourses(); }, [user]);
  useEffect(() => { if (selectedCourse) loadQuizzes(selectedCourse); }, [selectedCourse]);

  async function loadCourses() {
    const id = user?.userId || user?.id;
    if (!id) { setLoading(false); return; }
    const data = await courseApi.byInstructor(id).catch(() => []);
    setCourses(data);
    if (data.length) { setSelectedCourse(String(data[0].courseId)); }
    setLoading(false);
  }

  async function loadQuizzes(courseId) {
    const data = await quizApi.byCourse(courseId).catch(() => []);
    // Enrich with questions
    const enriched = await Promise.all(data.map(async q => {
      const questions = await quizApi.questions(q.quizId).catch(() => []);
      return { ...q, questions };
    }));
    setQuizzes(enriched);
  }

  // ── Quiz form helpers ──
  const setQ  = (k, v) => setQuiz(q => ({ ...q, [k]: v }));
  const setQn = (i, k, v) => setQuiz(q => ({ ...q, questions: q.questions.map((qn, idx) => idx === i ? { ...qn, [k]: v } : qn) }));
  const setOpt = (qi, oi, v) => setQuiz(q => ({
    ...q,
    questions: q.questions.map((qn, idx) => idx === qi
      ? { ...qn, options: qn.options.map((o, oidx) => oidx === oi ? v : o) }
      : qn)
  }));
  const addQuestion    = () => setQuiz(q => ({ ...q, questions: [...q.questions, emptyQuestion()] }));
  const removeQuestion = (i) => setQuiz(q => ({ ...q, questions: q.questions.filter((_, idx) => idx !== i) }));

  async function handleSave() {
    if (!selectedCourse || !quiz.title.trim()) return alert('Please fill in the quiz title.');
    setSaving(true);
    try {
      // 1. Create quiz
      const created = await quizApi.create({
        courseId: Number(selectedCourse),
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: Number(quiz.timeLimitMinutes),
        passingScore: Number(quiz.passingScore),
        maxAttempts: Number(quiz.maxAttempts),
      });
      const quizId = created?.quizId || created?.id;
      if (!quizId) throw new Error('Quiz creation failed');

      // 2. Add questions
      for (let i = 0; i < quiz.questions.length; i++) {
        const qn = quiz.questions[i];
        if (!qn.text.trim()) continue;
        const validOpts = qn.type === 'MCQ' ? qn.options.filter(o => o.trim()) : ['True', 'False'];
        await quizApi.addQuestion({
          quizId,
          text: qn.text,
          type: qn.type,
          correctAnswer: qn.correctAnswer,
          marks: Number(qn.marks) || 1,
          orderIndex: i + 1,
          options: validOpts,
        }).catch(() => {});
      }

      // 3. Publish
      await quizApi.publish(quizId).catch(() => {});

      alert('Quiz created and published successfully!');
      setShowForm(false);
      setQuiz(emptyQuiz());
      await loadQuizzes(selectedCourse);
    } catch (e) {
      alert(e.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuiz(quizId) {
    if (!window.confirm('Delete this quiz? All attempts will be lost.')) return;
    await quizApi.delete(quizId).catch(() => {});
    setQuizzes(prev => prev.filter(q => q.quizId !== quizId));
  }

  if (loading) return <Loading label="Loading quiz builder..." />;

  return (
    <section className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Quiz Builder</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create quizzes with MCQ & True/False questions, time limits, and passing scores.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', maxWidth: '220px' }}>
            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
          </select>
          <button className="button button-primary" onClick={() => setShowForm(v => !v)}>
            <PlusCircle size={16} /> {showForm ? 'Cancel' : 'New Quiz'}
          </button>
        </div>
      </div>

      {/* ── Create Quiz Form ── */}
      {showForm && (
        <div className="panel">
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>New Quiz</h2>

          {/* Quiz meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Quiz Title *</label>
              <input value={quiz.title} onChange={e => setQ('title', e.target.value)} placeholder="e.g. Module 1 Assessment" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Description</label>
              <input value={quiz.description} onChange={e => setQ('description', e.target.value)} placeholder="Optional description..." />
            </div>
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input type="number" min="1" value={quiz.timeLimitMinutes} onChange={e => setQ('timeLimitMinutes', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input type="number" min="0" max="100" value={quiz.passingScore} onChange={e => setQ('passingScore', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Attempts</label>
              <input type="number" min="1" value={quiz.maxAttempts} onChange={e => setQ('maxAttempts', e.target.value)} />
            </div>
          </div>

          {/* Questions */}
          <h3 style={{ fontSize: '16px', marginBottom: '14px', color: 'var(--text-muted)' }}>Questions</h3>
          <div className="list-stack">
            {quiz.questions.map((qn, qi) => (
              <div key={qi} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)' }}>Question {qi + 1}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select value={qn.type} onChange={e => setQn(qi, 'type', e.target.value)}
                      style={{ background: 'rgba(15,23,42,.6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '6px 10px', fontSize: '12px' }}>
                      <option value="MCQ">MCQ</option>
                      <option value="TrueFalse">True/False</option>
                    </select>
                    {quiz.questions.length > 1 && (
                      <button type="button" className="icon-button" style={{ width: '28px', height: '28px', color: '#f43f5e' }} onClick={() => removeQuestion(qi)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <input placeholder="Question text *" value={qn.text} onChange={e => setQn(qi, 'text', e.target.value)} />

                {/* MCQ options */}
                {qn.type === 'MCQ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Options (mark the correct one)</span>
                    {qn.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="radio" name={`correct-${qi}`} checked={qn.correctAnswer === opt && opt !== ''}
                          onChange={() => qn.correctAnswer !== opt && setQn(qi, 'correctAnswer', opt)}
                          style={{ width: 'auto', flexShrink: 0, accentColor: 'var(--accent)' }} />
                        <input placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                          onChange={e => {
                            const newVal = e.target.value;
                            if (qn.correctAnswer === opt) setQn(qi, 'correctAnswer', newVal);
                            setOpt(qi, oi, newVal);
                          }}
                          style={{ flex: 1 }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False */}
                {qn.type === 'TrueFalse' && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {['True', 'False'].map(v => (
                      <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input type="radio" name={`tf-${qi}`} checked={qn.correctAnswer === v}
                          onChange={() => setQn(qi, 'correctAnswer', v)} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
                        {v}
                      </label>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Marks:</span>
                  <input type="number" min="1" value={qn.marks} onChange={e => setQn(qi, 'marks', e.target.value)}
                    style={{ width: '70px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <button className="button button-secondary" onClick={addQuestion}>
              <PlusCircle size={15} /> Add Question
            </button>
            <button className="button button-primary" onClick={handleSave} disabled={saving}>
              <CheckCircle2 size={15} /> {saving ? 'Saving...' : 'Create & Publish Quiz'}
            </button>
          </div>
        </div>
      )}

      {/* ── Existing Quizzes ── */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
          Existing Quizzes <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '400' }}>({quizzes.length})</span>
        </h2>
        {quizzes.length === 0 ? (
          <div className="state-box">
            <ClipboardList size={36} style={{ color: 'var(--text-muted)', opacity: .4 }} />
            <h3>No quizzes yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create your first quiz for this course.</p>
          </div>
        ) : (
          <div className="list-stack">
            {quizzes.map(q => (
              <div key={q.quizId} className="panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>{q.title}</h3>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>⏱ {q.timeLimitMinutes} min</span>
                      <span>✅ Pass: {q.passingScore}%</span>
                      <span>🔁 Max: {q.maxAttempts} attempts</span>
                      <span>📝 {q.questions?.length || 0} questions</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="button button-secondary" style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                      onClick={() => setExpandedQuiz(expandedQuiz === q.quizId ? null : q.quizId)}>
                      {expandedQuiz === q.quizId ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} Questions
                    </button>
                    <button className="button button-danger" style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                      onClick={() => handleDeleteQuiz(q.quizId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expandedQuiz === q.quizId && q.questions?.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {q.questions.map((qn, i) => (
                      <div key={qn.questionId || i} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '14px' }}>Q{i+1}: {qn.text}</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {(qn.options || []).map((opt, oi) => (
                            <span key={oi} style={{
                              padding: '3px 10px', borderRadius: '50px', fontSize: '12px',
                              background: opt === qn.correctAnswer ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.05)',
                              border: `1px solid ${opt === qn.correctAnswer ? 'rgba(16,185,129,.5)' : 'var(--border)'}`,
                              color: opt === qn.correctAnswer ? 'var(--accent)' : 'var(--text-muted)',
                            }}>{opt === qn.correctAnswer && '✓ '}{opt}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
