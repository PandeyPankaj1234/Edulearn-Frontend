import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Bell, BookOpen, GraduationCap, LayoutDashboard, LogOut, 
  MessageSquare, UserRound, ClipboardList, CreditCard,
  TrendingUp, Users, Settings, PlusCircle, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationApi } from '../api/services';

const getNavItems = (role) => {
  if (role === 'Admin') {
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/courses', label: 'Course Approvals', icon: BookOpen },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/admin/certificates', label: 'Certificates', icon: Award },
      { to: '/admin/notifications', label: 'Send Notification', icon: Bell },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ];
  }
  if (role === 'Instructor') {
    return [
      { to: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/instructor/courses', label: 'My Courses', icon: BookOpen },
      { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
      { to: '/instructor/quizzes', label: 'Quiz Builder', icon: ClipboardList },
      { to: '/instructor/students', label: 'Enrollments', icon: Users },
      { to: '/instructor/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/instructor/forums', label: 'Forums', icon: MessageSquare },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ];
  }
  return [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/courses', label: 'Catalog', icon: BookOpen },
    { to: '/my-learning', label: 'My Learning', icon: GraduationCap },
    { to: '/quizzes', label: 'Quizzes', icon: ClipboardList },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/discussions', label: 'Discussions', icon: MessageSquare },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ];
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = getNavItems(user?.role || 'Student');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count for the bell badge
  useEffect(() => {
    if (!user?.userId && !user?.id) return;
    const uid = user.userId || user.id;
    notificationApi.unreadCount(uid)
      .then(count => setUnreadCount(Number(count) || 0))
      .catch(() => setUnreadCount(0));

    // Poll every 60 seconds
    const interval = setInterval(() => {
      notificationApi.unreadCount(uid)
        .then(count => setUnreadCount(Number(count) || 0))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const getPageTitle = () => {
    const currentNav = navItems.find(nav => nav.to === location.pathname || location.pathname.startsWith(nav.to) && nav.to !== '/');
    return currentNav ? currentNav.label : 'Dashboard';
  };

  const avatarInitial = user?.fullName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <div className="brand-mark">EL</div>
          <h2>EduLearn</h2>
        </Link>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink end={item.to === '/' || item.to === '/admin' || item.to === '/instructor'} key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <NavLink
              to="/notifications"
              className={({ isActive }) => (isActive ? 'active' : '')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)', position: 'relative' }}
            >
              <span style={{ position: 'relative' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700',
                    borderRadius: '50%', width: '17px', height: '17px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-color)',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              Notifications
            </NavLink>
          </div>
        )}
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="user-chip">
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div className="avatar">
                {avatarInitial || <UserRound size={18} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{user?.fullName || user?.name || 'Guest'}</span>
                {user?.role && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.role}</span>}
              </div>
            </Link>
            {user ? (
              <button className="icon-button" type="button" onClick={logout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            ) : (
              <Link className="button button-primary" to="/login" style={{ minHeight: '36px', padding: '0 16px' }}>Login</Link>
            )}
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
