import { useEffect, useState } from 'react';
import { Users, UserX, Search, Shield, GraduationCap, RefreshCw, Loader2 } from 'lucide-react';
import { authApi } from '../api/services';
import Loading from '../components/Loading';

export default function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionId, setActionId]     = useState(null); // userId being actioned

  async function load() {
    setLoading(true);
    try {
      const data = await authApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSuspend(userId) {
    setActionId(userId);
    try {
      const updated = await authApi.suspendUser(userId);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, status: updated.status } : u));
    } catch { alert('Failed to update user status.'); }
    setActionId(null);
  }

  async function handleDelete(userId) {
    if (!window.confirm('Permanently delete this user account? This cannot be undone.')) return;
    setActionId(userId);
    try {
      await authApi.deleteAccount(userId);
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch { alert('Failed to delete user.'); }
    setActionId(null);
  }

  if (loading) return <Loading label="Loading users..." />;

  const ROLE_ICONS = { Student: GraduationCap, Instructor: Shield, Admin: Shield };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const statusClass = s => {
    if (s === 'Active')    return 'status-active';
    if (s === 'Suspended') return 'status-failed';
    return 'status-inactive';
  };

  const instructors = users.filter(u => u.role === 'Instructor').length;
  const students    = users.filter(u => u.role === 'Student').length;
  const suspended   = users.filter(u => u.status === 'Suspended').length;

  return (
    <section className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>View, suspend, or delete platform users.</p>
        </div>
        <button className="icon-button" onClick={load} title="Refresh"><RefreshCw size={16}/></button>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--primary)', bg: 'rgba(99,102,241,.1)', Icon: Users },
          { label: 'Instructors',  value: instructors,  color: 'var(--secondary)', bg: 'rgba(236,72,153,.1)', Icon: Shield },
          { label: 'Students',     value: students,     color: 'var(--accent)', bg: 'rgba(16,185,129,.1)', Icon: GraduationCap },
          { label: 'Suspended',    value: suspended,    color: '#f43f5e', bg: 'rgba(244,63,94,.1)', Icon: UserX },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="metric">
            <div className="metric-icon" style={{ color, background: bg }}><Icon size={24}/></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <option value="all">All Roles</option>
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : filtered.map(u => {
              const Icon = ROLE_ICONS[u.role] || Users;
              const isActioning = actionId === u.userId;
              return (
                <tr key={u.userId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
                        {(u.fullName || '?').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{u.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Icon size={14} style={{ color: 'var(--text-muted)' }} /> {u.role}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td><span className={`status-badge ${statusClass(u.status || 'Active')}`}>{u.status || 'Active'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`button ${u.status === 'Suspended' ? 'button-success' : 'button-secondary'}`}
                        style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                        disabled={isActioning}
                        onClick={() => handleSuspend(u.userId)}>
                        {isActioning ? <Loader2 size={12} style={{ animation: 'spin .8s linear infinite' }} /> : <UserX size={13} />}
                        {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button
                        className="button button-danger"
                        style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                        disabled={isActioning}
                        onClick={() => handleDelete(u.userId)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
