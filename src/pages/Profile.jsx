import { useState } from 'react';
import { UserRound, Mail, Phone, Save, Camera, BookOpen, Award, Key, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';

export default function Profile() {
  const { user, login } = useAuth();
  const [tab, setTab] = useState('profile');

  const uid = user?.userId || user?.id;

  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    bio: user?.bio || '',
    profilePicUrl: user?.profilePicUrl || '',
    learningGoal: user?.learningGoal || '',
  });

  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [saveMsg, setSaveMsg] = useState('');

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwState, setPwState] = useState('idle');
  const [pwError, setPwError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaveState('saving');
    try {
      const updated = await authApi.updateProfile(uid, {
        fullName: form.fullName,
        mobile: form.mobile,
        bio: form.bio,
        profilePicUrl: form.profilePicUrl,
        learningGoal: form.learningGoal,
      }).catch(() => null);

      // Update local storage so the nav avatar reflects changes immediately
      const updatedUser = { ...user, ...form };
      localStorage.setItem('edulearn_user', JSON.stringify(updatedUser));

      setSaveState('saved');
      setSaveMsg('Profile updated successfully!');
    } catch {
      setSaveState('error');
      setSaveMsg('Failed to save. Please try again.');
    } finally {
      setTimeout(() => setSaveState('idle'), 3000);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (!passwords.current) return setPwError('Enter your current password.');
    if (passwords.newPass.length < 6) return setPwError('New password must be at least 6 characters.');
    if (passwords.newPass !== passwords.confirm) return setPwError('Passwords do not match.');

    setPwState('saving');
    try {
      await authApi.changePassword(uid, passwords.newPass).catch(() => { throw new Error('API error'); });
      setPwState('saved');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch {
      setPwState('error');
      setPwError('Failed to change password. Check your current password.');
    } finally {
      setTimeout(() => setPwState('idle'), 3000);
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Use a local object URL as preview (no file upload server needed)
    const url = URL.createObjectURL(file);
    setForm(f => ({ ...f, profilePicUrl: url }));
  };

  const TABS = [
    { key: 'profile', label: 'Profile Info', icon: UserRound },
    { key: 'password', label: 'Change Password', icon: Key },
  ];

  const initials = (form.fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <section className="page-stack">
      <div>
        <h1 style={{ fontSize: '32px' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Update your personal information and account settings.</p>
      </div>

      <div className="two-column" style={{ alignItems: 'flex-start' }}>
        {/* Left: Avatar + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '32px' }}>
            <div style={{ position: 'relative' }}>
              {form.profilePicUrl ? (
                <img src={form.profilePicUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', fontSize: '32px', fontWeight: '700', border: '3px solid rgba(99,102,241,0.4)', color: '#fff' }}>
                  {initials}
                </div>
              )}
              {/* File input for avatar upload */}
              <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '0', right: '0', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-color)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <Camera size={13} color="#fff" />
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>{form.fullName || 'User'}</h3>
              <span className={`status-badge ${user?.role === 'Instructor' ? 'status-pending' : user?.role === 'Admin' ? 'status-failed' : 'status-active'}`} style={{ marginBottom: '8px', display: 'inline-block' }}>
                {user?.role || 'Student'}
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0' }}>{form.email}</p>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Account Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: BookOpen, label: 'Role', value: user?.role || 'Student' },
                { icon: Award, label: 'User ID', value: uid || '—' },
                { icon: Mail, label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'Jan 2025' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Icon size={15} /> {label}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-solid)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content' }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px',
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
                background: tab === key ? 'var(--primary)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--text-muted)',
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <form className="form-section" onSubmit={handleSave}>
              <h3>Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={form.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email cannot be changed. Contact support.</span>
              </div>
              <div className="form-group">
                <label>Profile Picture URL</label>
                <input value={form.profilePicUrl} onChange={e => setForm(f => ({ ...f, profilePicUrl: e.target.value }))} placeholder="https://... or use the camera icon to upload" />
              </div>
              <div className="form-group">
                <label>Bio / About Me</label>
                <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell the community about yourself..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Learning Goals</label>
                <input value={form.learningGoal} onChange={e => setForm(f => ({ ...f, learningGoal: e.target.value }))} placeholder="e.g. Become a full-stack developer by Q3" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                {saveState === 'saved' && <span style={{ color: 'var(--accent)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> {saveMsg}</span>}
                {saveState === 'error' && <span style={{ color: '#f43f5e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16} /> {saveMsg}</span>}
                <button type="submit" className="button button-primary" disabled={saveState === 'saving'}>
                  <Save size={16} /> {saveState === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* PASSWORD TAB */}
          {tab === 'password' && (
            <form className="form-section" onSubmit={handlePasswordChange}>
              <h3>Change Password</h3>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="At least 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" />
              </div>
              {pwError && <p style={{ color: '#f43f5e', fontSize: '14px', margin: '0 0 12px' }}>{pwError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                {pwState === 'saved' && <span style={{ color: 'var(--accent)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Password updated!</span>}
                <button type="submit" className="button button-primary" disabled={pwState === 'saving'}>
                  <Key size={16} /> {pwState === 'saving' ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
