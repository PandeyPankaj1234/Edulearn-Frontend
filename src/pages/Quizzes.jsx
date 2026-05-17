import { useEffect, useState, useRef, useCallback } from 'react';
import { courseApi, enrollmentApi, quizApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, PlayCircle, ClipboardList, Timer, AlertCircle,
  Trophy, X, RotateCcw, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import Loading from '../components/Loading';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
const timeAgo = (d) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
};

// Mock data for when backend is unavailable
const MOCK_QUESTIONS = [
  { questionId: 1, text: 'What hook manages state in React?', options: ['useEffect','useState','useRef','useMemo'], correctAnswer: 'useState', marks: 1 },
  { questionId: 2, text: 'Which annotation marks a Spring Boot entry point?', options: ['@Component','@SpringBootApplication','@RestController','@Service'], correctAnswer: '@SpringBootApplication', marks: 1 },
  { questionId: 3, text: 'What does REST stand for?', options: ['Remote Execution State Transfer','Representational State Transfer','Resource Entity State Transfer','Remote Entity State Transfer'], correctAnswer: 'Representational State Transfer', marks: 1 },
];

// ─── Quiz Engine ─────────────────────────────────────────────────────────────
function QuizEngine({ quiz, questions, studentId, onFinish }) {
  const total = questions.length;
  const [current, setCurrent]   = useState(0);
  // answers: { [questionId]: selectedAnswerString }
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState((quiz.timeLimitMinutes || 15) * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSubmit = useCallback(async (auto = false) => {
    if (submitting || submitted) return;
    clearInterval(timerRef.current);
    setSubmitting(true);

    // Score locally — options are plain strings, correctAnswer is a string
    let correct = 0;
    const breakdown = questions.map(q => {
      const chosen = answers[q.questionId] || null;
      const isRight = chosen !== null && chosen === q.correctAnswer;
      if (isRight) correct++;
      return { text: q.text, chosen, correctAnswer: q.correctAnswer, isRight };
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (quiz.passingScore || 70);

    // Submit to backend: answers is Map<Long,String>
    try {
      const payload = {
        quizId: quiz.quizId,
        studentId,
        answers: Object.fromEntries(
          Object.entries(answers).map(([qId, ans]) => [Number(qId), ans])
        ),
      };
      await quizApi.submit(payload).catch(() => {});
    } catch {}

    setResult({ score, passed, correct, total, breakdown });
    setSubmitted(true);
    setSubmitting(false);
  }, [answers, questions, quiz, studentId, submitted, submitting, total]);

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
        {/* Score hero */}
        <div style={{ padding:'40px', borderRadius:'var(--radius-lg)', textAlign:'center',
          background: result.passed
            ? 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(99,102,241,.1))'
            : 'linear-gradient(135deg,rgba(244,63,94,.15),rgba(99,102,241,.1))',
          border:`1px solid ${result.passed ? 'var(--accent)' : '#f43f5e'}` }}>
          <div style={{ fontSize:'76px', fontWeight:'800', lineHeight:1,
            color: result.passed ? 'var(--accent)' : '#f43f5e' }}>
            {result.score}%
          </div>
          <div style={{ fontSize:'22px', fontWeight:'700', marginTop:'12px' }}>
            {result.passed ? '🎉 Passed!' : '❌ Try Again'}
          </div>
          <p style={{ color:'var(--text-muted)', marginTop:'8px' }}>
            {result.correct}/{result.total} correct · Passing score: {quiz.passingScore || 70}%
          </p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'24px' }}>
            <button className="button button-primary" onClick={onFinish}>
              <ChevronLeft size={16}/> Back to Quizzes
            </button>
            <button className="button button-secondary" onClick={onFinish}>
              <RotateCcw size={16}/> Retake
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="panel">
          <h3 style={{ fontSize:'18px', marginBottom:'16px' }}>Question Breakdown</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {result.breakdown.map((b, i) => (
              <div key={i} style={{ padding:'14px 16px', borderRadius:'var(--radius-sm)',
                background: b.isRight ? 'rgba(16,185,129,.08)' : 'rgba(244,63,94,.08)',
                border:`1px solid ${b.isRight ? 'rgba(16,185,129,.3)' : 'rgba(244,63,94,.3)'}`,
                display:'flex', gap:'12px', alignItems:'flex-start' }}>
                {b.isRight
                  ? <CheckCircle2 size={18} color="var(--accent)" style={{ flexShrink:0, marginTop:'2px' }}/>
                  : <AlertCircle  size={18} color="#f43f5e"       style={{ flexShrink:0, marginTop:'2px' }}/>}
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:'600' }}>
                    Q{i+1}: {b.text}
                  </p>
                  {!b.isRight && (
                    <p style={{ margin:0, fontSize:'12px', color:'var(--text-muted)' }}>
                      Your answer: <span style={{ color:'#f43f5e' }}>{b.chosen || 'Not answered'}</span>
                      {' · '}Correct: <span style={{ color:'var(--accent)' }}>{b.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ───────────────────────────────────────────────────────
  const q = questions[current];
  if (!q) return <p style={{ color:'var(--text-muted)' }}>No questions loaded.</p>;
  const isLow = timeLeft < 60;
  const answered = Object.keys(answers).length;
  const pct = ((current + 1) / total) * 100;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'14px 20px', background:'var(--surface-solid)', borderRadius:'var(--radius-lg)',
        border:'1px solid var(--border)', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{quiz.title}</div>
          <div style={{ fontSize:'15px', fontWeight:'700' }}>Question {current+1} of {total}</div>
        </div>
        {/* Timer */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px',
          background: isLow ? 'rgba(239,68,68,.15)' : 'rgba(99,102,241,.1)',
          padding:'8px 16px', borderRadius:'50px',
          border:`1px solid ${isLow ? '#ef4444' : 'var(--primary)'}` }}>
          <Timer size={16} color={isLow ? '#ef4444' : 'var(--primary)'}/>
          <span style={{ fontFamily:'monospace', fontSize:'20px', fontWeight:'800',
            color: isLow ? '#ef4444' : 'var(--primary)' }}>{fmt(timeLeft)}</span>
        </div>
        <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>{answered}/{total} answered</div>
      </div>

      {/* Progress bar */}
      <div style={{ height:'4px', background:'rgba(255,255,255,.08)', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', transition:'width .3s ease',
          background:'linear-gradient(90deg,var(--primary),var(--accent))' }}/>
      </div>

      {/* Question */}
      <div className="panel" style={{ padding:'28px' }}>
        <h2 style={{ fontSize:'20px', lineHeight:'1.5', marginBottom:'24px' }}>
          {current+1}. {q.text}
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {(q.options || []).map((opt, i) => {
            const isSelected = answers[q.questionId] === opt;
            return (
              <button key={i} type="button"
                onClick={() => setAnswers(prev => ({ ...prev, [q.questionId]: opt }))}
                style={{ padding:'14px 18px', textAlign:'left', borderRadius:'var(--radius-sm)',
                  border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(99,102,241,.12)' : 'var(--surface-solid)',
                  color:'var(--text-main)', cursor:'pointer', fontSize:'14px',
                  display:'flex', alignItems:'center', gap:'12px', transition:'all .15s' }}>
                <span style={{ width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                  border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  display:'grid', placeItems:'center', fontSize:'12px', fontWeight:'700',
                  color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <button className="button button-secondary"
          onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}>
          <ChevronLeft size={16}/> Previous
        </button>

        {/* Question number dots */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'center' }}>
          {questions.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)} style={{
              width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer',
              fontWeight:'600', fontSize:'12px', border:'1px solid',
              borderColor: i===current ? 'var(--primary)' : answers[questions[i].questionId] ? 'var(--accent)' : 'var(--border)',
              background: i===current ? 'var(--primary)' : answers[questions[i].questionId] ? 'rgba(16,185,129,.15)' : 'transparent',
              color: i===current ? '#fff' : 'var(--text-main)',
            }}>{i+1}</button>
          ))}
        </div>

        {current < total-1 ? (
          <button className="button button-primary" onClick={() => setCurrent(c => c+1)}>
            Next <ChevronRight size={16}/>
          </button>
        ) : (
          <button className="button button-primary" onClick={() => doSubmit(false)}
            disabled={submitting}
            style={{ background:'var(--accent)', borderColor:'var(--accent)' }}>
            <Trophy size={16}/> {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Quizzes() {
  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [courses, setCourses]           = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseQuizzes, setCourseQuizzes]   = useState([]);
  const [quizLoading, setQuizLoading]   = useState(false);
  const [attempts, setAttempts]         = useState([]);
  const [quizMap, setQuizMap]           = useState({});   // quizId → title
  const [bestScores, setBestScores]     = useState({});   // quizId → score int
  const [attemptCounts, setAttemptCounts] = useState({}); // quizId → count
  const [activeQuiz, setActiveQuiz]     = useState(null); // { quiz, questions }

  // ── Load enrolled courses + attempt history ───────────────────────────────
  useEffect(() => {
    async function init() {
      if (!user?.userId) {
        setCourses([{ courseId: 1, title: 'Mastering Full-Stack Development' }]);
        setSelectedCourse({ courseId: 1, title: 'Mastering Full-Stack Development' });
        setAttempts([]);
        setLoading(false);
        return;
      }
      try {
        // Enrolled courses
        const enrollments = await enrollmentApi.byStudent(user.userId).catch(() => []);
        let cs = [];
        if (enrollments.length) {
          cs = await Promise.all(enrollments.map(async e => {
            try { const c = await courseApi.byId(e.courseId); return { courseId: e.courseId, title: c.title }; }
            catch { return { courseId: e.courseId, title: `Course #${e.courseId}` }; }
          }));
        }
        if (!cs.length) cs = [{ courseId: 1, title: 'Mastering Full-Stack Development' }];
        setCourses(cs);
        setSelectedCourse(cs[0]);

        // Attempt history
        const att = await quizApi.attemptsByStudent(user.userId).catch(() => []);
        setAttempts(att);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  // ── Load quizzes for selected course ─────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) return;
    setQuizLoading(true);
    setBestScores({});
    setQuizMap({});
    (async () => {
      try {
        const qs = await quizApi.byCourse(selectedCourse.courseId).catch(() => []);
        setCourseQuizzes(qs);

        // Build quizMap for attempt history labels
        const map = {};
        qs.forEach(q => { map[q.quizId] = q.title; });
        setQuizMap(map);

        // Best score per quiz + attempt counts
        if (user?.userId && qs.length) {
          const scores = {};
          const counts = {};
          await Promise.allSettled(qs.map(async q => {
            try {
              const res = await quizApi.bestScore(user.userId, q.quizId);
              const score = res?.score ?? res?.body?.score ?? null;
              if (score !== null && score !== undefined) scores[q.quizId] = score;
            } catch {}
            try {
              const cnt = await quizApi.attemptCount(user.userId, q.quizId);
              counts[q.quizId] = Number(cnt) || 0;
            } catch { counts[q.quizId] = 0; }
          }));
          setBestScores(scores);
          setAttemptCounts(counts);
        }
      } catch (e) { console.error(e); }
      finally { setQuizLoading(false); }
    })();
  }, [selectedCourse, user]);

  // ── Start quiz ────────────────────────────────────────────────────────────
  async function startQuiz(quiz) {
    let questions = [];
    try {
      questions = await quizApi.questions(quiz.quizId).catch(() => []);
      if (!questions.length) questions = MOCK_QUESTIONS;
    } catch { questions = MOCK_QUESTIONS; }
    setActiveQuiz({ quiz, questions });
  }

  function onQuizFinish() {
    setActiveQuiz(null);
    // Refresh attempts + counts
    if (user?.userId) {
      quizApi.attemptsByStudent(user.userId).then(a => setAttempts(a || [])).catch(() => {});
      // Refresh best scores and attempt counts for current course quizzes
      if (courseQuizzes.length) {
        const scores = {};
        const counts = {};
        Promise.allSettled(courseQuizzes.map(async q => {
          try {
            const res = await quizApi.bestScore(user.userId, q.quizId);
            const score = res?.score ?? null;
            if (score !== null) scores[q.quizId] = score;
          } catch {}
          try {
            const cnt = await quizApi.attemptCount(user.userId, q.quizId);
            counts[q.quizId] = Number(cnt) || 0;
          } catch { counts[q.quizId] = 0; }
        })).then(() => { setBestScores({...scores}); setAttemptCounts({...counts}); });
      }
    }
  }

  if (loading) return <Loading label="Loading quizzes…"/>;

  // ── Active Quiz ───────────────────────────────────────────────────────────
  if (activeQuiz) {
    return (
      <section className="page-stack">
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'8px' }}>
          <button className="button button-secondary" onClick={() => setActiveQuiz(null)}>
            <X size={15}/> Exit Quiz
          </button>
          <h1 style={{ fontSize:'22px' }}>{activeQuiz.quiz.title}</h1>
          <span style={{ fontSize:'13px', color:'var(--text-muted)', marginLeft:'auto' }}>
            {activeQuiz.questions.length} questions · Pass at {activeQuiz.quiz.passingScore || 70}%
          </span>
        </div>
        <QuizEngine
          quiz={activeQuiz.quiz}
          questions={activeQuiz.questions}
          studentId={user?.userId}
          onFinish={onQuizFinish}
        />
      </section>
    );
  }

  // ── Quiz List ─────────────────────────────────────────────────────────────
  return (
    <section className="page-stack">
      <div className="auth-copy" style={{ borderRadius:'var(--radius-lg)', padding:'32px', marginBottom:'16px' }}>
        <h1 style={{ fontSize:'32px', marginBottom:'8px' }}>Assessments & Quizzes</h1>
        <p style={{ maxWidth:'600px' }}>Timed quizzes with immediate scored feedback. Track your best scores and attempt history.</p>
      </div>

      <div className="two-column">
        {/* ── Left: Quiz List ── */}
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
            <h2 style={{ fontSize:'20px', margin:0 }}>Available Quizzes</h2>
            <select value={selectedCourse?.courseId || ''}
              onChange={e => setSelectedCourse(courses.find(c => String(c.courseId) === e.target.value))}
              style={{ background:'var(--surface-solid)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)', padding:'8px 12px', color:'var(--text-main)', maxWidth:'220px' }}>
              {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
            </select>
          </div>

          {quizLoading ? <Loading label="Fetching quizzes…"/> : (
            <div className="list-stack">
              {courseQuizzes.length === 0 ? (
                <div className="state-box" style={{ background:'transparent' }}>
                  <AlertCircle size={36} style={{ color:'var(--text-muted)', opacity:.4 }}/>
                  <h3 style={{ marginTop:'12px' }}>No Quizzes Yet</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>This course has no published quizzes.</p>
                </div>
              ) : courseQuizzes.map(quiz => (
                <div key={quiz.quizId} style={{ padding:'18px 20px', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)', background:'var(--surface-solid)',
                  display:'flex', gap:'14px', alignItems:'flex-start' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'10px', flexShrink:0,
                    background:'rgba(99,102,241,.1)', display:'grid', placeItems:'center', color:'var(--primary)' }}>
                    <ClipboardList size={24}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontSize:'15px', margin:'0 0 6px', fontWeight:'700' }}>{quiz.title}</h3>
                    {quiz.description && <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:'0 0 8px' }}>{quiz.description}</p>}
                    <div style={{ display:'flex', gap:'14px', fontSize:'12px', color:'var(--text-muted)', flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                        <Timer size={12}/> {quiz.timeLimitMinutes || 15} min
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                        <CheckCircle2 size={12}/> Pass: {quiz.passingScore || 70}%
                      </span>
                      {quiz.maxAttempts && (
                        <span style={{ color: (attemptCounts[quiz.quizId] || 0) >= quiz.maxAttempts ? '#f43f5e' : 'inherit' }}>
                          Attempts: {attemptCounts[quiz.quizId] || 0}/{quiz.maxAttempts}
                        </span>
                      )}
                      {bestScores[quiz.quizId] !== undefined && (
                        <span style={{ color:'var(--accent)', display:'flex', alignItems:'center', gap:'4px' }}>
                          <TrendingUp size={12}/> Best: {bestScores[quiz.quizId]}%
                        </span>
                      )}
                    </div>
                  </div>
                  {(() => {
                    const count  = attemptCounts[quiz.quizId] || 0;
                    const maxAtt = quiz.maxAttempts;
                    const exhausted = maxAtt && count >= maxAtt;
                    return exhausted ? (
                      <div style={{ flexShrink:0, textAlign:'center' }}>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:'#f43f5e', background:'rgba(244,63,94,.1)', border:'1px solid rgba(244,63,94,.3)', borderRadius:'var(--radius-sm)', padding:'6px 12px', whiteSpace:'nowrap' }}>
                          ✗ Limit Reached
                        </div>
                        <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'4px' }}>{count}/{maxAtt} used</div>
                      </div>
                    ) : (
                      <button className="button button-primary"
                        onClick={() => startQuiz(quiz)}
                        style={{ flexShrink:0, whiteSpace:'nowrap' }}>
                        <PlayCircle size={15}/> Start
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Attempt History ── */}
        <div className="panel">
          <h2 style={{ fontSize:'20px', marginBottom:'20px' }}>Attempt History</h2>
          {attempts.length === 0 ? (
            <div className="state-box" style={{ background:'transparent' }}>
              <ClipboardList size={36} style={{ color:'var(--text-muted)', opacity:.4 }}/>
              <h3 style={{ marginTop:'12px' }}>No attempts yet</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>Take a quiz to see your history here.</p>
            </div>
          ) : (
            <div className="list-stack">
              {[...attempts].reverse().map(a => (
                <div key={a.attemptId} style={{ padding:'14px 16px', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-sm)', background:'rgba(0,0,0,.15)',
                  display:'flex', gap:'12px', alignItems:'flex-start' }}>
                  {a.passed
                    ? <CheckCircle2 size={20} color="var(--accent)" style={{ flexShrink:0, marginTop:'2px' }}/>
                    : <AlertCircle  size={20} color="#f43f5e"       style={{ flexShrink:0, marginTop:'2px' }}/>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'14px', fontWeight:'600', marginBottom:'4px' }}>
                      {quizMap[a.quizId] || `Quiz #${a.quizId}`}
                    </div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', gap:'10px', flexWrap:'wrap' }}>
                      <span>Score: <strong style={{ color: a.passed ? 'var(--accent)' : '#f43f5e' }}>{a.score}%</strong></span>
                      <span>·</span>
                      <span>{timeAgo(a.submittedAt)}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px',
                    borderRadius:'50px', whiteSpace:'nowrap',
                    background: a.passed ? 'rgba(16,185,129,.15)' : 'rgba(244,63,94,.15)',
                    color: a.passed ? 'var(--accent)' : '#f43f5e',
                    border:`1px solid ${a.passed ? 'rgba(16,185,129,.4)' : 'rgba(244,63,94,.4)'}` }}>
                    {a.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
