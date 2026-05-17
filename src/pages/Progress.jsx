import { useEffect, useState } from 'react';
import { Award, TrendingUp, CheckCircle2, Download, BookOpen, Clock, FileCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { progressApi, enrollmentApi, courseApi, notificationApi } from '../api/services';
import Loading from '../components/Loading';

// ── Certificate HTML generator (printable) ───────────────────────────────────
function generateCertificateHTML(cert, userName) {
  const issued = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
  const code = cert.certificateCode || cert.certificateId || cert.id || ('CERT-' + Math.random().toString(36).substr(2,8).toUpperCase());
  return `<!DOCTYPE html>
<html><head><title>Certificate – ${cert.courseTitle || cert.course}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#f8f9ff; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Inter',sans-serif; }
  .page { width:900px; padding:20px; }
  .cert { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:60px 70px; text-align:center; position:relative; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.1); }
  .stripe { position:absolute; top:0; left:0; right:0; height:8px; background:linear-gradient(90deg,#6366f1,#ec4899,#8b5cf6); }
  .inner-border { position:absolute; inset:20px; border:1px solid rgba(99,102,241,0.2); border-radius:10px; pointer-events:none; }
  .logo { font-size:13px; font-weight:700; letter-spacing:4px; color:#6366f1; margin-bottom:32px; text-transform:uppercase; }
  h1 { font-family:'Playfair Display',serif; font-size:38px; color:#1e293b; margin-bottom:8px; }
  .presented { font-size:14px; color:#94a3b8; margin-bottom:20px; letter-spacing:1px; }
  .name { font-family:'Playfair Display',serif; font-size:42px; font-style:italic; color:#6366f1; border-bottom:2px solid #6366f1; display:inline-block; padding:0 60px 10px; margin-bottom:24px; }
  .completed { font-size:14px; color:#64748b; margin-bottom:12px; }
  .course { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:#1e293b; margin-bottom:32px; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:32px; padding-top:24px; border-top:1px solid #e2e8f0; }
  .sig { text-align:center; }
  .sig-line { width:160px; border-bottom:1px solid #94a3b8; margin-bottom:8px; height:32px; }
  .sig-name { font-weight:600; font-size:13px; color:#1e293b; }
  .sig-title { font-size:11px; color:#94a3b8; }
  .seal { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#ec4899); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:700; text-align:center; line-height:1.4; padding:8px; }
  .cert-id { font-size:10px; color:#94a3b8; font-family:monospace; margin-top:16px; }
</style></head>
<body><div class="page"><div class="cert">
  <div class="stripe"></div>
  <div class="inner-border"></div>
  <div class="logo">EduLearn</div>
  <h1>Certificate of Completion</h1>
  <p class="presented">THIS IS TO CERTIFY THAT</p>
  <div class="name">${userName || 'Student'}</div>
  <p class="completed">has successfully completed the course</p>
  <p class="course">${cert.courseTitle || cert.course || 'Course'}</p>
  <div class="footer">
    <div class="sig"><div class="sig-line"></div><div class="sig-name">EduLearn Platform</div><div class="sig-title">Issued: ${issued}</div></div>
    <div class="seal">✓<br/>VERIFIED<br/>CERTIFICATE</div>
    ${cert.instructorName || cert.instructor ? `<div class="sig"><div class="sig-line"></div><div class="sig-name">${cert.instructorName || cert.instructor}</div><div class="sig-title">Course Instructor</div></div>` : '<div></div>'}
  </div>
  <p class="cert-id">Certificate ID: ${code}</p>
</div></div></body></html>`;
}

function downloadCertificate(cert, userName) {
  const html = generateCertificateHTML(cert, userName);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) win.focus();
  // Also trigger download
  const a = document.createElement('a');
  a.href = url; a.download = `EduLearn-Certificate-${(cert.courseTitle||'').replace(/\s+/g,'-')}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Progress() {
  const { user } = useAuth();
  const [loading, setLoading]               = useState(true);
  const [progressRecords, setProgressRecords] = useState([]);
  const [certificates, setCertificates]     = useState([]);
  const [enrollments, setEnrollments]       = useState([]);
  const [courseMap, setCourseMap]           = useState({});
  const [claiming, setClaiming]             = useState({}); // courseId -> bool
  const [stats, setStats]                   = useState({ overallCompletion: 0, coursesCompleted: 0, activeCourses: 0, hoursLearned: 0 });

  const uid      = user?.userId || user?.id;
  const userName = user?.fullName || user?.name || 'Student';

  useEffect(() => { if (uid) load(); else setLoading(false); }, [uid]);

  async function load() {
    try {
      // 1. Enrollments (source of truth)
      const enrs = await enrollmentApi.byStudent(uid).catch(() => []);
      setEnrollments(enrs);

      const enrolledIds = new Set(enrs.map(e => String(e.courseId)));

      // 2. Build course title map
      const cMap = {};
      enrs.forEach(e => { cMap[e.courseId] = e.courseTitle || e.title || `Course #${e.courseId}`; });
      await Promise.allSettled(
        enrs.filter(e => !cMap[e.courseId] || cMap[e.courseId].startsWith('Course #'))
          .map(async e => {
            try { const c = await courseApi.byId(e.courseId); if (c?.title) cMap[e.courseId] = c.title; } catch {}
          })
      );
      setCourseMap(cMap);

      // 3. Lesson-level progress records (filtered to enrolled courses)
      const prog = await progressApi.allByStudent(uid).catch(() => []);
      const relevantProg = prog.filter(p => enrolledIds.has(String(p.courseId)));
      setProgressRecords(relevantProg.length > 0 ? relevantProg : enrs.map(e => ({ courseId: e.courseId, _synthetic: true, _percent: Number(e.progressPercent) || 0 })));

      // 4. Real certificates from backend
      const certs = await progressApi.certificates(uid).catch(() => []);
      setCertificates(Array.isArray(certs) ? certs : []);

      // 5. Stats
      if (enrs.length > 0) {
        const percents = enrs.map(e => Number(e.progressPercent) || 0);
        setStats({
          overallCompletion: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
          coursesCompleted:  percents.filter(p => p >= 100).length,
          activeCourses:     percents.filter(p => p > 0 && p < 100).length,
          hoursLearned:      Math.round(relevantProg.reduce((s, p) => s + (p.watchedSeconds || 0), 0) / 3600),
        });
      }
    } catch (err) {
      console.error('Progress load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function claimCertificate(courseId) {
    setClaiming(p => ({ ...p, [courseId]: true }));
    try {
      // Fetch course details to get instructor name (backend requires it)
      let instructorName = 'EduLearn Instructor';
      try {
        const course = await courseApi.byId(courseId);
        instructorName = course?.instructorName || course?.instructor?.fullName || 'EduLearn Instructor';
      } catch {}

      const enr = enrollments.find(e => String(e.courseId) === String(courseId));

      // Backend expects: studentId, courseId, studentName, courseName, instructorName
      const cert = await progressApi.issueCertificate({
        studentId:     uid,
        courseId:      courseId,
        studentName:   userName,
        courseName:    courseMap[courseId] || `Course #${courseId}`,
        instructorName,
      });

      setCertificates(prev => [...prev, cert]);

      // Send certificate notification
      notificationApi.send({
        userId: uid,
        type: 'CERTIFICATE',
        title: '🎓 Certificate Issued!',
        message: `Congratulations! Your certificate for "${courseMap[courseId]}" has been issued. Download it from your Progress page.`,
        relatedEntityId: courseId,
        relatedEntityType: 'COURSE',
      }).catch(() => {});

      alert(`🎉 Certificate issued for "${courseMap[courseId]}"!\nScroll down to "My Certificates" to download it.`);
    } catch (err) {
      // If already issued, just refresh from backend
      try {
        const certs = await progressApi.certificates(uid);
        if (Array.isArray(certs) && certs.length > 0) {
          setCertificates(certs);
          alert('✅ Your certificate was already issued! Scroll down to download it.');
          return;
        }
      } catch {}
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || '';
      alert(`Failed to issue certificate. ${msg || 'Please try again.'}`);
    } finally {
      setClaiming(p => ({ ...p, [courseId]: false }));
    }
  }

  // Group progress by course
  const courseProgress = {};
  progressRecords.forEach(p => {
    if (p._synthetic) {
      courseProgress[p.courseId] = { synthetic: true, percent: p._percent };
    } else {
      if (!courseProgress[p.courseId]) courseProgress[p.courseId] = { total: 0, done: 0, watchedSeconds: 0 };
      courseProgress[p.courseId].total++;
      if (p.isCompleted) courseProgress[p.courseId].done++;
      courseProgress[p.courseId].watchedSeconds += p.watchedSeconds || 0;
    }
  });

  const certCourseIds = new Set(certificates.map(c => String(c.courseId)));

  if (loading) return <Loading label="Loading progress data..." />;

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>My Progress & Certificates</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track your learning and download verifiable completion certificates.</p>
      </div>

      {/* Stats */}
      <div className="metric-grid">
        {[
          { icon: <TrendingUp size={24}/>, label: 'Overall Completion', value: `${stats.overallCompletion}%`, color: 'var(--primary)', bg: 'rgba(99,102,241,.1)' },
          { icon: <CheckCircle2 size={24}/>, label: 'Courses Completed', value: stats.coursesCompleted, color: 'var(--accent)', bg: 'rgba(16,185,129,.1)' },
          { icon: <BookOpen size={24}/>, label: 'Active Courses', value: stats.activeCourses, color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
          { icon: <Award size={24}/>, label: 'Certificates Earned', value: certificates.length, color: '#a78bfa', bg: 'rgba(167,139,250,.1)' },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="metric-icon" style={{ color: m.color, background: m.bg }}>{m.icon}</div>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>

      {/* ── Course Progress + Claim Certificate ── */}
      {Object.keys(courseProgress).length > 0 && (
        <div className="panel">
          <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Course Progress</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(courseProgress).map(([courseId, cp]) => {
              const pct     = cp.synthetic ? cp.percent : (cp.total > 0 ? Math.round((cp.done / cp.total) * 100) : 0);
              const label   = cp.synthetic ? `${pct}% complete` : `${cp.done}/${cp.total} lessons completed`;
              const isComplete    = pct >= 100;
              const hasCert       = certCourseIds.has(String(courseId));
              const isClaiming    = claiming[courseId];

              return (
                <div key={courseId} style={{ padding: '16px', background: 'var(--surface-solid)', border: `1px solid ${isComplete ? 'rgba(16,185,129,.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>{courseMap[courseId] || `Course #${courseId}`}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '18px', color: isComplete ? 'var(--accent)' : 'var(--primary)' }}>{pct}%</span>

                      {/* ── CLAIM / DOWNLOAD CERTIFICATE ── */}
                      {isComplete && !hasCert && (
                        <button
                          className="button button-success"
                          style={{ minHeight: '34px', padding: '0 14px', fontSize: '13px' }}
                          onClick={() => claimCertificate(courseId)}
                          disabled={isClaiming}>
                          {isClaiming
                            ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} /> Issuing…</>
                            : <><Award size={14} /> Claim Certificate</>}
                        </button>
                      )}
                      {isComplete && hasCert && (
                        <span style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                          <CheckCircle2 size={14} /> Certificate Earned ↓
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isComplete ? 'var(--accent)' : 'linear-gradient(90deg,var(--primary),var(--primary-light))', borderRadius: '4px', transition: 'width .6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My Certificates ── */}
      <div className="panel" style={{ background: 'linear-gradient(135deg,var(--surface) 0%,rgba(30,41,59,.3) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px' }}>My Certificates</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{certificates.length} earned</span>
        </div>

        {certificates.length === 0 ? (
          <div className="state-box" style={{ background: 'transparent' }}>
            <FileCheck size={40} style={{ color: 'var(--text-muted)', opacity: .4 }} />
            <h3 style={{ marginTop: '16px' }}>No certificates yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Complete a course at 100%, then click <strong>"Claim Certificate"</strong> in the Course Progress section above.
            </p>
          </div>
        ) : (
          <div className="course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))' }}>
            {certificates.map((cert, idx) => {
              const issued = cert.issuedAt
                ? new Date(cert.issuedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Recently';
              const code = cert.certificateCode || cert.certificateId || cert.id;
              return (
                <div key={code || idx} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg,#6366f1,#ec4899)' }} />
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: .04, color: 'var(--primary)' }}>
                    <Award size={120} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                      <Award size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', margin: '0 0 4px', lineHeight: '1.4' }}>{cert.courseTitle || cert.course || `Course #${cert.courseId}`}</h3>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Issued: {issued}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Certificate ID:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{code}</span>
                    </div>
                    {(cert.instructorName || cert.instructor) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Instructor:</span><span>{cert.instructorName || cert.instructor}</span>
                      </div>
                    )}
                  </div>
                  <button className="button button-primary" onClick={() => downloadCertificate(cert, userName)} style={{ width: '100%', justifyContent: 'center' }}>
                    <Download size={16} /> Download Certificate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
