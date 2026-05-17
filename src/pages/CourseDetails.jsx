import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle2, MessageSquare, PlusCircle, Star, Users, Clock, Award, Shield, FileText, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from 'lucide-react';
import { courseApi, discussionApi, enrollmentApi, lessonApi, progressApi, paymentApi, notificationApi } from '../api/services';
import { useRazorpay } from '../hooks/useRazorpay';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { minutes, currency } from '../utils/formatters';

const DEMO_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openCheckout, MockModal } = useRazorpay();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lessonResources, setLessonResources] = useState([]);
  const [previewLesson, setPreviewLesson] = useState(null); // for non-enrolled preview modal

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const mockCourse = {
    courseId, title: 'Mastering Full-Stack Development',
    description: 'Learn to build scalable applications from scratch using React, Spring Boot, and Microservices.',
    instructor: 'Dr. Sarah Connor', category: 'Web Development', level: 'Intermediate',
    price: 99, rating: 4.8, students: 12540, totalDuration: 1200,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
  };

  const mockLessons = [
    { lessonId: 1, title: 'Introduction to Microservices', durationMinutes: 15, isPreview: true, contentUrl: DEMO_VIDEO, orderIndex: 1 },
    { lessonId: 2, title: 'Setting up Spring Boot', durationMinutes: 45, isPreview: false, contentUrl: DEMO_VIDEO, orderIndex: 2 },
    { lessonId: 3, title: 'React Hooks Deep Dive', durationMinutes: 60, isPreview: false, contentUrl: DEMO_VIDEO, orderIndex: 3 },
    { lessonId: 4, title: 'Authentication with JWT', durationMinutes: 55, isPreview: false, contentUrl: DEMO_VIDEO, orderIndex: 4 },
  ];

  useEffect(() => {
    // Reset state when navigating to a different course
    // This prevents stale activeLesson from Course A triggering trackLessonStart under Course B's courseId
    setActiveLesson(null);
    setCompletedLessons(new Set());
    setIsEnrolled(false);

    async function load() {
      setLoading(true);
      try {
        const courseData = await courseApi.byId(courseId).catch(() => mockCourse);
        const lessonData = await lessonApi.byCourse(courseId).catch(() => mockLessons);
        const resolvedLessons = lessonData?.length ? lessonData.map(l => ({ ...l, contentUrl: l.contentUrl || DEMO_VIDEO })) : mockLessons;
        setCourse(courseData || mockCourse);
        setLessons(resolvedLessons);
        // NOTE: Do NOT set activeLesson here for non-enrolled users
        // It will be set below only if enrolled

        if (user?.userId) {
          const enrolled = await enrollmentApi.check(user.userId, courseId).catch(() => false);
          setIsEnrolled(!!enrolled);
          if (enrolled) {
            const prog = await progressApi.allByStudent(user.userId).catch(() => []);
            const completed = new Set(prog.filter(p => p.isCompleted && String(p.courseId) === String(courseId)).map(p => p.lessonId));
            setCompletedLessons(completed);
            // Resume: find first incomplete lesson
            const firstIncomplete = resolvedLessons.find(l => !completed.has(l.lessonId));
            setActiveLesson(firstIncomplete || resolvedLessons[0]);
          }
          // Non-enrolled: activeLesson stays null — prevents ghost progress records
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, user]);

  // Reset video + fetch resources + TRACK lesson start when active lesson changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }

    // ── TRACK lesson start so progress record exists in DB ──────────────
    // Guard: only track if user is enrolled AND a lesson is actually active
    // Removing courseId from deps prevents this from firing when navigating between courses
    async function trackLessonStart() {
      if (!activeLesson?.lessonId || !user?.userId || !isEnrolled) return;
      try {
        await progressApi.track({
          studentId: user.userId,
          lessonId: activeLesson.lessonId,
          courseId: parseInt(courseId),
          isCompleted: false,
          watchedSeconds: 0,
        }).catch(() => {}); // silently fail — record may already exist
      } catch {}
    }
    trackLessonStart();

    // Fetch real resources; fall back to demo PDFs
    async function fetchResources() {
      if (!activeLesson?.lessonId) return;
      try {
        const data = await lessonApi.resources(activeLesson.lessonId).catch(() => []);
        if (data && data.length > 0) {
          setLessonResources(data);
        } else {
          setLessonResources([
            { resourceId: 1, name: 'Lesson Slides.pdf', fileType: 'pdf', sizeKb: 420, fileUrl: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
            { resourceId: 2, name: 'Source Code.zip', fileType: 'code', sizeKb: 85, fileUrl: 'https://github.com/spring-projects/spring-boot/archive/refs/heads/main.zip' },
            { resourceId: 3, name: 'Reading Notes.pdf', fileType: 'pdf', sizeKb: 210, fileUrl: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf' },
          ]);
        }
      } catch {
        setLessonResources([]);
      }
    }
    fetchResources();
  // Note: isEnrolled and courseId intentionally NOT in deps
  // Adding courseId would re-fire this with stale activeLesson when navigating courses
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.lessonId, user?.userId]);

  // Video controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    const d = videoRef.current.duration || 1;
    setCurrentTime(t);
    setProgress((t / d) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }

    const price = parseFloat(course?.price) || 0;

    // FREE course — enroll directly
    if (price === 0) {
      setEnrolling(true);
      try {
        await enrollmentApi.enroll({
          studentId: user.userId,
          courseId: parseInt(courseId),
          studentEmail: user.email,
          studentName: user.name || user.fullName || 'Student',
          courseName: course?.title,
        });
        setIsEnrolled(true);
        // Send enrollment notification
        notificationApi.send({
          userId: user.userId,
          type: 'ENROLLMENT',
          title: 'Enrollment Confirmed!',
          message: `You are now enrolled in "${course?.title}". Start learning today!`,
          relatedEntityId: courseId,
          relatedEntityType: 'COURSE',
        }).catch(() => {});
      } catch (e) {
        alert('Enrollment failed. Please try again.');
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // PAID course — open Razorpay
    openCheckout({
      amount: price,
      name: course?.title || 'Course Enrollment',
      description: `Enroll in ${course?.title}`,
      userEmail: user?.email || '',
      userName:  user?.fullName || user?.name || '',
      onSuccess: async (paymentId) => {
        setEnrolling(true);
        try {
          // 1. Record payment in backend
          await paymentApi.process({
            studentId: user.userId,
            courseId:  parseInt(courseId),
            amount:    price,
            currency:  'USD',
            paymentId,
            status:    'SUCCESS',
            studentEmail: user.email,
            studentName:  user.name || user.fullName || 'Student',
            courseName:   course?.title,
          }).catch(() => {}); // non-blocking

          // 2. Enroll the student
          await enrollmentApi.enroll({
            studentId: user.userId,
            courseId: parseInt(courseId),
            studentEmail: user.email,
            studentName: user.name || user.fullName || 'Student',
            courseName: course?.title,
          });
          setIsEnrolled(true);

          // 3. Send enrollment + payment notifications
          notificationApi.send({
            userId: user.userId,
            type: 'ENROLLMENT',
            title: 'Enrollment Confirmed!',
            message: `You are now enrolled in "${course?.title}". Start learning today!`,
            relatedEntityId: courseId,
            relatedEntityType: 'COURSE',
          }).catch(() => {});
          notificationApi.send({
            userId: user.userId,
            type: 'PAYMENT',
            title: 'Payment Successful',
            message: `Your payment of $${price} for "${course?.title}" was successful.`,
            relatedEntityId: courseId,
            relatedEntityType: 'COURSE',
          }).catch(() => {});
        } catch (e) {
          alert('Payment succeeded but enrollment failed. Please contact support.');
        } finally {
          setEnrolling(false);
        }
      },
      onFailure: (reason) => {
        // 'Payment cancelled' = user closed modal, don't show alert
        if (reason && reason !== 'Payment cancelled') {
          alert(`Payment failed: ${reason}. Please try again.`);
        }
      },
    });
  };

  const markComplete = async () => {
    if (!user?.userId || !activeLesson) return;

    // Optimistic UI update first
    const newCompleted = new Set([...completedLessons, activeLesson.lessonId]);
    setCompletedLessons(newCompleted);

    try {
      // 1. Mark this specific lesson as complete in progress service
      await progressApi.completeLesson(user.userId, activeLesson.lessonId).catch(() => {});

      // 2. Update enrollment progressPercent so MyLearning + Progress pages stay in sync
      const progressPct = lessons.length > 0
        ? Math.round((newCompleted.size / lessons.length) * 100)
        : 0;

      // Find the enrollment record to update its progress
      const enrollments = await enrollmentApi.byStudent(user.userId).catch(() => []);
      const enr = enrollments.find(e => String(e.courseId) === String(courseId));
      if (enr?.enrollmentId) {
        await enrollmentApi.updateProgress(enr.enrollmentId, progressPct).catch(() => {});
      }

      // 3. If all lessons done, issue a certificate
      if (progressPct === 100) {
        await progressApi.issueCertificate({
          studentId: user.userId,
          courseId: parseInt(courseId),
          courseTitle: course?.title || 'Course',
        }).catch(() => {});
      }
    } catch {}

    // Auto-advance to next lesson
    const idx = lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
    if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
  };

  const skipPrev = () => {
    const idx = lessons.findIndex(l => l.lessonId === activeLesson?.lessonId);
    if (idx > 0) setActiveLesson(lessons[idx - 1]);
  };

  const skipNext = () => {
    const idx = lessons.findIndex(l => l.lessonId === activeLesson?.lessonId);
    if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
  };

  const fmt = (s) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };

  if (loading) return <Loading label="Loading course..." />;
  if (!course) return <div>Course not found</div>;

  const completedCount = completedLessons.size;
  const progressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  // ENROLLED: Full Player View
  if (isEnrolled) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>

        {/* Left: Video + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Video Player */}
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', position: 'relative' }}>
            <video
              ref={videoRef}
              src={activeLesson?.contentUrl || DEMO_VIDEO}
              style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => { setIsPlaying(false); setProgress(100); }}
              onClick={togglePlay}
              preload="metadata"
              playsInline
            />

            {/* Overlay play icon when paused */}
            {!isPlaying && (
              <div onClick={togglePlay} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', cursor: 'pointer', pointerEvents: 'auto' }}>
                <PlayCircle size={80} color="#fff" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.7))' }} />
              </div>
            )}

            {/* Controls bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
              {/* Progress bar */}
              <div onClick={handleSeek} style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', cursor: 'pointer', marginBottom: '10px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.1s linear' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={skipPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}><SkipBack size={18} /></button>
                <button onClick={togglePlay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}>
                  {isPlaying ? <Pause size={22} /> : <PlayCircle size={22} />}
                </button>
                <button onClick={skipNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}><SkipForward size={18} /></button>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <span style={{ color: '#fff', fontSize: '13px', marginLeft: '4px' }}>{fmt(currentTime)} / {fmt(duration)}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => videoRef.current?.requestFullscreen()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><Maximize size={18} /></button>
              </div>
            </div>
          </div>

          {/* Lesson Info — Tabbed */}
          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {[['overview', 'Overview'], ['resources', `Resources (${lessonResources.length})`], ['qa', 'Q&A']].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    background: 'transparent', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >{label}</button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>{activeLesson?.title}</h2>
                  <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                    <span><Clock size={13} style={{ verticalAlign: 'middle' }} /> {activeLesson?.durationMinutes} min</span>
                    <span><FileText size={13} style={{ verticalAlign: 'middle' }} /> {lessonResources.length} Resources</span>
                  </div>
                  <p style={{ lineHeight: '1.7', color: '#cbd5e1', marginBottom: '20px', fontSize: '14px' }}>
                    In this lesson, we cover the foundational concepts of <strong>{activeLesson?.title}</strong>. Follow along with the code examples in the repository.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      className={`button ${completedLessons.has(activeLesson?.lessonId) ? 'button-secondary' : 'button-primary'}`}
                      onClick={markComplete}
                      disabled={completedLessons.has(activeLesson?.lessonId)}
                    >
                      <CheckCircle2 size={16} />
                      {completedLessons.has(activeLesson?.lessonId) ? 'Completed ✓' : 'Mark as Complete'}
                    </button>
                    <button className="button button-secondary" onClick={skipNext}
                      disabled={lessons.findIndex(l => l.lessonId === activeLesson?.lessonId) >= lessons.length - 1}>
                      <SkipForward size={16} /> Next Lesson
                    </button>
                  </div>
                </>
              )}

              {/* RESOURCES TAB */}
              {activeTab === 'resources' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Downloadable materials for this lesson:</p>
                  {lessonResources.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No resources for this lesson.</p>
                  ) : lessonResources.map(res => (
                    <div key={res.resourceId} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-solid)', border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                        background: res.fileType === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                        display: 'grid', placeItems: 'center',
                        color: res.fileType === 'pdf' ? '#f87171' : 'var(--primary)',
                      }}>
                        <FileText size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.name}</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{res.fileType} · {res.sizeKb ? `${res.sizeKb} KB` : ''}</span>
                      </div>
                      <a
                        href={res.fileUrl}
                        download={res.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-secondary"
                        style={{ flexShrink: 0, fontSize: '13px', padding: '0 14px', height: '36px' }}
                      >
                        ↓ Download
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Q&A TAB */}
              {activeTab === 'qa' && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px' }}>Have a question about this lesson?</p>
                  <button className="button button-primary" style={{ marginTop: '16px' }}
                    onClick={() => window.open('/discussions', '_self')}>
                    <MessageSquare size={16} /> Go to Discussions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Curriculum Sidebar */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '17px', marginBottom: '10px' }}>Course Content</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>{completedCount} / {lessons.length} completed</span>
              <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{progressPct}%</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '50px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: '50px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.lessonId === lesson.lessonId;
              const isDone = completedLessons.has(lesson.lessonId);
              return (
                <div
                  key={lesson.lessonId}
                  onClick={() => setActiveLesson(lesson)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    display: 'flex', alignItems: 'flex-start', gap: '12px', transition: 'background 0.2s',
                    marginBottom: '2px',
                  }}
                >
                  {isDone
                    ? <CheckCircle2 size={20} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isActive ? 'var(--primary)' : 'var(--text-muted)'}`, marginTop: '2px', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                        {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 4px', color: isActive ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: '1.4' }}>
                      {idx + 1}. {lesson.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PlayCircle size={11} /> {lesson.durationMinutes} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // NOT ENROLLED: Marketing View
  return (
    <>
      {MockModal}
    <div className="page-stack">
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: '60px', background: `linear-gradient(to right, rgba(15,23,42,0.95) 40%, rgba(15,23,42,0.4)), url(${course.thumbnailUrl}) center/cover` }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span className="badge" style={{ position: 'static' }}>{course.category}</span>
            <span className="badge" style={{ position: 'static', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-light)', borderColor: 'var(--primary)' }}>{course.level}</span>
          </div>
          <h1 style={{ fontSize: '42px', lineHeight: '1.2', marginBottom: '20px' }}>{course.title}</h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '32px' }}>{course.description}</p>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <span style={{ color: '#f5c84c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Star fill="#f5c84c" size={18} /> {course.rating}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}><Users size={18} /> {(course.students || 0).toLocaleString()} students</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}><Clock size={18} /> {minutes(course.totalDuration)}</span>
          </div>
          <button className="button button-primary" onClick={handleEnroll} disabled={enrolling} style={{ fontSize: '18px', padding: '0 32px', height: '56px' }}>
            {enrolling ? 'Enrolling...' : `Enroll Now — $${course.price}`}
          </button>
        </div>
      </div>

      <div className="two-column">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel">
            <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>What you'll learn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {['Build modern web apps','Master React Hooks','Deploy to AWS','Implement CI/CD','Secure REST APIs','Microservice patterns'].map((item,i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Course Content</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {lessons.filter(l => l.isPreview).length} free preview lesson{lessons.filter(l => l.isPreview).length !== 1 ? 's' : ''} available
            </p>
            <div className="list-stack">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.lessonId}
                  className="list-row"
                  onClick={() => lesson.isPreview && setPreviewLesson(lesson)}
                  style={{
                    padding: '14px 16px', background: 'var(--surface-solid)', border: '1px solid var(--border)',
                    cursor: lesson.isPreview ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => lesson.isPreview && (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => lesson.isPreview && (e.currentTarget.style.background = 'var(--surface-solid)')}
                >
                  {lesson.isPreview
                    ? <PlayCircle size={18} color="var(--primary)" />
                    : <span style={{ width: '18px', height: '18px', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>🔒</span>
                  }
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: lesson.isPreview ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                      {idx+1}. {lesson.title}
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {lesson.isPreview && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(99,102,241,0.3)' }}>FREE PREVIEW</span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{lesson.durationMinutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel">
            <h3 style={{ fontSize: '18px', marginBottom: '18px' }}>This course includes:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                [PlayCircle, `${minutes(course.totalDuration)} on-demand video`],
                [FileText, '45 downloadable resources'],
                [CheckCircle2, '12 coding exercises'],
                [Award, 'Certificate of completion'],
                [Shield, '30-Day Money-Back Guarantee'],
              ].map(([Icon, text], i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#cbd5e1', fontSize: '14px' }}>
                  <Icon size={18} color="var(--primary)" /> {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Instructor</h3>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: '700', flexShrink: 0 }}>
                {(course.instructor || 'I')[0]}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{course.instructor || 'Expert Instructor'}</h4>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Senior Software Engineer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ── FREE PREVIEW MODAL ────────────────────────────── */}
      {previewLesson && (
        <div
          onClick={() => setPreviewLesson(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '820px', background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px', display: 'block' }}>Free Preview</span>
                <h3 style={{ margin: 0, fontSize: '17px' }}>{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', fontWeight: '700' }}
              >✕</button>
            </div>

            {/* Video */}
            <video
              src={previewLesson.contentUrl || DEMO_VIDEO}
              controls
              autoPlay
              style={{ width: '100%', display: 'block', background: '#000', maxHeight: '460px' }}
            />

            {/* CTA */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', background: 'var(--surface-solid)' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '15px' }}>Enjoying this preview?</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Enroll to unlock all {lessons.length} lessons, quizzes & certificate.</p>
              </div>
              <button
                className="button button-primary"
                onClick={() => { setPreviewLesson(null); handleEnroll(); }}
                style={{ flexShrink: 0, height: '44px', padding: '0 28px', fontSize: '15px' }}
              >
                Enroll Now — ${course.price}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
