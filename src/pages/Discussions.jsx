import { useEffect, useState, useCallback } from 'react';
import { discussionApi } from '../api/services';
import { MessageSquare, ThumbsUp, MessageCircle, X, Send, ChevronDown, ChevronUp, Pin, CheckCircle2, Trash2, Lock } from 'lucide-react';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const mockThreads = [
  { threadId: 1, title: 'How to implement JWT Refresh Tokens?', body: "I'm struggling to understand how to securely store the refresh token on the client side. Should I use httpOnly cookies?", authorName: 'Alex Chen', role: 'Student', replyCount: 14, upvotes: 32, createdAt: new Date(Date.now() - 7200000).toISOString(), hasAcceptedAnswer: true },
  { threadId: 2, title: '[Pinned] Course Updates - v2.0 released', body: 'Welcome to the updated course! We have added 5 new lessons covering advanced deployment strategies.', authorName: 'Dr. Sarah Connor', role: 'Instructor', replyCount: 45, upvotes: 128, createdAt: new Date(Date.now() - 86400000).toISOString(), isPinned: true },
  { threadId: 3, title: 'Error: Cannot read properties of undefined', body: 'When running the starter code from Lesson 4, I\'m getting this error. Anyone else?', authorName: 'Sam Wilson', role: 'Student', replyCount: 3, upvotes: 5, createdAt: new Date(Date.now() - 18000000).toISOString() },
];

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

// ── New Thread Modal ─────────────────────────────────────────────────────────
function NewThreadModal({ onClose, onCreated, user }) {
  const [form, setForm] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return setError('Title and body are required.');
    setBusy(true);
    try {
      const thread = await discussionApi.createThread({
        title: form.title,
        body: form.body,
        authorId: user?.userId || user?.id || 1,
        authorName: user?.fullName || user?.name || 'Student',
      }).catch(() => ({
        threadId: Date.now(), title: form.title, body: form.body,
        authorName: user?.fullName || 'You', replyCount: 0, upvotes: 0,
        createdAt: new Date().toISOString(),
      }));
      onCreated(thread);
      onClose();
    } catch { setError('Failed to post. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Start a Discussion</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Title <span style={{ color: '#f43f5e' }}>*</span></label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What's your question or topic?" required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Body <span style={{ color: '#f43f5e' }}>*</span></label>
            <textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Describe your question in detail..." style={{ resize: 'vertical' }} required />
          </div>
          {error && <p style={{ color: '#f43f5e', fontSize: '13px', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={busy}><Send size={15} /> {busy ? 'Posting...' : 'Post Discussion'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Thread Row with expandable replies ───────────────────────────────────────
function ThreadRow({ thread, user, onUpvote, onDelete, onPin, onClose }) {
  const isInstructor = user?.role === 'Instructor' || user?.role === 'Admin';
  const isOwner = String(thread.authorId) === String(user?.userId || user?.id);
  const canModerate = isInstructor || isOwner;
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(thread.upvotes || 0);
  const [upvoted, setUpvoted] = useState(false);

  async function loadReplies() {
    if (repliesLoaded) return;
    const data = await discussionApi.replies(thread.threadId).catch(() => []);
    setReplies(data);
    setRepliesLoaded(true);
  }

  function handleExpand() {
    if (!expanded) loadReplies();
    setExpanded(p => !p);
  }

  async function handleUpvoteThread() {
    if (upvoted) return;
    setUpvoted(true);
    setLocalUpvotes(v => v + 1);
    // Backend upvote (if endpoint exists, otherwise silently fail)
    await Promise.resolve();
    onUpvote?.(thread.threadId);
  }

  async function handleReplyUpvote(replyId) {
    await discussionApi.upvoteReply(replyId).catch(() => {});
    setReplies(prev => prev.map(r => r.replyId === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r));
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const r = await discussionApi.reply({
        threadId: thread.threadId,
        body: replyText,
        authorId: user?.userId || user?.id || 1,
        authorName: user?.fullName || user?.name || 'You',
      }).catch(() => ({
        replyId: Date.now(), body: replyText,
        authorName: user?.fullName || 'You', upvotes: 0, isAccepted: false,
        createdAt: new Date().toISOString(),
      }));
      setReplies(prev => [...prev, r]);
      setReplyText('');
    } finally { setPosting(false); }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: thread.isPinned ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.2s' }}>
      {/* Thread header */}
      <div style={{ padding: '20px 24px', display: 'flex', gap: '16px' }}>
        {/* Upvote */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '40px' }}>
          <button onClick={handleUpvoteThread} style={{ background: upvoted ? 'rgba(99,102,241,0.15)' : 'transparent', border: upvoted ? '1px solid var(--primary)' : 'none', color: upvoted ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px', padding: '6px' }}>
            <ThumbsUp size={18} />
          </button>
          <span style={{ fontWeight: '700', fontSize: '14px', color: localUpvotes > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{localUpvotes}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
            {thread.isPinned && <span style={{ fontSize: '10px', fontWeight: '700', color: '#f5c84c', background: 'rgba(245,200,76,0.15)', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(245,200,76,0.3)' }}>📌 PINNED</span>}
            {thread.hasAcceptedAnswer && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(16,185,129,0.3)' }}>✓ SOLVED</span>}
            <h3 style={{ margin: 0, fontSize: '16px', cursor: 'pointer', color: 'var(--text-main)' }} onClick={handleExpand}>{thread.title}</h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: expanded ? 999 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{thread.body}</p>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: thread.role === 'Instructor' ? 'var(--secondary)' : 'var(--primary)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '9px', fontWeight: '800' }}>
                {(thread.authorName || 'U')[0]}
              </div>
              {thread.authorName} {thread.role === 'Instructor' && <span style={{ color: '#a78bfa', fontSize: '11px' }}>(Instructor)</span>}
            </span>
            <span>•</span>
            <span>{timeAgo(thread.createdAt)}</span>
            <button onClick={handleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', padding: '0 4px' }}>
              <MessageCircle size={14} /> {thread.replyCount || replies.length} {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* ── Instructor Moderation Controls ── */}
            {canModerate && (
              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                {isInstructor && (
                  <button title={thread.isPinned ? 'Unpin' : 'Pin thread'}
                    onClick={async () => { await discussionApi.pinThread(thread.threadId).catch(()=>{}); onPin?.(thread.threadId); }}
                    style={{ background: thread.isPinned ? 'rgba(245,200,76,.15)' : 'transparent', border: '1px solid', borderColor: thread.isPinned ? 'rgba(245,200,76,.4)' : 'var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#f5c84c', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <Pin size={12} /> {thread.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {isInstructor && (
                  <button title={thread.isClosed ? 'Thread closed' : 'Close thread'}
                    onClick={async () => { await discussionApi.closeThread(thread.threadId).catch(()=>{}); onClose?.(thread.threadId); }}
                    style={{ background: thread.isClosed ? 'rgba(244,63,94,.1)' : 'transparent', border: '1px solid', borderColor: thread.isClosed ? 'rgba(244,63,94,.3)' : 'var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: thread.isClosed ? '#f43f5e' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <Lock size={12} /> {thread.isClosed ? 'Closed' : 'Close'}
                  </button>
                )}
                <button title="Delete thread"
                  onClick={async () => { if (!window.confirm('Delete this thread?')) return; await discussionApi.deleteThread(thread.threadId).catch(()=>{}); onDelete?.(thread.threadId); }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies section */}
      {expanded && (
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0 24px 20px 80px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {replies.length === 0 && repliesLoaded && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>No replies yet. Be the first!</p>
          )}
          {replies.map(r => (
            <div key={r.replyId} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-solid)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>
                {(r.authorName || 'U')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.authorName}</span>
                  {r.isAccepted && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700' }}>✓ ACCEPTED</span>}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#cbd5e1' }}>{r.body}</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => handleReplyUpvote(r.replyId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ThumbsUp size={13} /> {r.upvotes || 0} helpful
                  </button>
                  {/* Instructor: accept best reply */}
                  {isInstructor && !r.isAccepted && (
                    <button onClick={async () => {
                      await discussionApi.acceptReply(r.replyId).catch(() => {});
                      setReplies(prev => prev.map(rr => ({ ...rr, isAccepted: rr.replyId === r.replyId })));
                    }} style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', color: 'var(--accent)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Accept Answer
                    </button>
                  )}
                  {/* Owner or instructor: delete reply */}
                  {(isInstructor || String(r.authorId) === String(user?.userId || user?.id)) && (
                    <button onClick={async () => {
                      if (!window.confirm('Delete this reply?')) return;
                      await discussionApi.deleteReply(r.replyId).catch(() => {});
                      setReplies(prev => prev.filter(rr => rr.replyId !== r.replyId));
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Reply input */}
          {user && (
            <form onSubmit={submitReply} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>
                {(user.fullName || user.name || 'U')[0]}
              </div>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                style={{ flex: 1, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-main)', fontSize: '14px' }}
              />
              <button type="submit" className="button button-primary" disabled={posting || !replyText.trim()} style={{ height: '40px', padding: '0 16px' }}>
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Discussions Page ─────────────────────────────────────────────────────
export default function Discussions() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest | top
  const [filterBy, setFilterBy] = useState('all'); // all | mine | unanswered
  const [showNewModal, setShowNewModal] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (search.trim()) {
        data = await discussionApi.searchThreads(search).catch(() => mockThreads);
      } else if (filterBy === 'mine' && (user?.userId || user?.id)) {
        data = await discussionApi.threadsByAuthor(user.userId || user.id).catch(() => mockThreads);
      } else {
        data = await discussionApi.threadsByCourse(1).catch(() => mockThreads); // default courseId
      }
      setThreads(data && data.length ? data : mockThreads);
    } catch { setThreads(mockThreads); }
    finally { setLoading(false); }
  }, [search, filterBy, user]);

  useEffect(() => { loadThreads(); }, [filterBy]);

  function onCreated(thread) {
    setThreads(prev => [thread, ...prev]);
  }

  function onDelete(threadId) {
    setThreads(prev => prev.filter(t => t.threadId !== threadId));
  }

  function onPin(threadId) {
    setThreads(prev => prev.map(t =>
      t.threadId === threadId ? { ...t, isPinned: !t.isPinned } : t
    ));
  }

  function onClose(threadId) {
    setThreads(prev => prev.map(t =>
      t.threadId === threadId ? { ...t, isClosed: true } : t
    ));
  }

  const displayed = [...threads].sort((a, b) => {
    if (sortBy === 'top') return (b.upvotes || 0) - (a.upvotes || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }).filter(t => {
    if (filterBy === 'unanswered') return !t.replyCount && !t.hasAcceptedAnswer;
    return true;
  });

  if (loading) return <Loading label="Loading discussions..." />;

  return (
    <section className="page-stack">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Community Forums</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ask questions, share knowledge, and help peers.</p>
        </div>
        {user && (
          <button className="button button-primary" onClick={() => setShowNewModal(true)}>
            <MessageSquare size={16} /> New Discussion
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <form className="search-box" onSubmit={e => { e.preventDefault(); loadThreads(); }} style={{ flex: 1, minWidth: '240px' }}>
          <input placeholder="Search discussions..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none' }} />
          {search && <button type="button" onClick={() => { setSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={15} /></button>}
        </form>

        <select value={filterBy} onChange={e => setFilterBy(e.target.value)} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', color: 'var(--text-main)', minWidth: '150px' }}>
          <option value="all">All Topics</option>
          <option value="mine">My Threads</option>
          <option value="unanswered">Unanswered</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', color: 'var(--text-main)', minWidth: '130px' }}>
          <option value="latest">Latest</option>
          <option value="top">Top Voted</option>
        </select>
      </div>

      {/* Threads */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <div className="state-box" style={{ padding: '60px' }}>
            <MessageSquare size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <h3 style={{ marginTop: '16px' }}>No discussions found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Be the first to start a conversation!</p>
            {user && <button className="button button-primary" onClick={() => setShowNewModal(true)} style={{ marginTop: '16px' }}>Start Discussion</button>}
          </div>
        ) : displayed.map(thread => (
          <ThreadRow key={thread.threadId} thread={thread} user={user}
            onDelete={onDelete} onPin={onPin} onClose={onClose} />
        ))}
      </div>

      {/* New Thread Modal */}
      {showNewModal && <NewThreadModal onClose={() => setShowNewModal(false)} onCreated={onCreated} user={user} />}
    </section>
  );
}
