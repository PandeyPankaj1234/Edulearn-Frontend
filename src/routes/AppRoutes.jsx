import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';

// General Pages
import Courses from '../pages/Courses';
import CourseDetails from '../pages/CourseDetails';
import Discussions from '../pages/Discussions';

// Student Pages
import StudentDashboard from '../pages/StudentDashboard';
import MyLearning from '../pages/MyLearning';
import Lessons from '../pages/Lessons';
import Quizzes from '../pages/Quizzes';
import Progress from '../pages/Progress';
import Payments from '../pages/Payments';
import Enrollments from '../pages/Enrollments';

// Instructor Pages
import InstructorDashboard from '../pages/InstructorDashboard';
import InstructorCourses from '../pages/InstructorCourses';
import CreateCourse from '../pages/CreateCourse';
import InstructorStudents from '../pages/InstructorStudents';
import InstructorAnalytics from '../pages/InstructorAnalytics';
import InstructorQuizBuilder from '../pages/InstructorQuizBuilder';

// Admin Pages
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsers from '../pages/AdminUsers';
import AdminCourses from '../pages/AdminCourses';
import AdminPayments from '../pages/AdminPayments';
import AdminAnalytics from '../pages/AdminAnalytics';
import AdminSettings from '../pages/AdminSettings';
import AdminCertificates from '../pages/AdminCertificates';
import AdminNotifications from '../pages/AdminNotifications';

// Shared
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';

import { useAuth } from '../context/AuthContext';

// --- Route Guards ---

function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
      if (user?.role === 'Instructor') return <Navigate to="/instructor" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default function AppRoutes() {
  const { user } = useAuth();

  const DashboardRouter = () => {
    if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'Instructor') return <Navigate to="/instructor" replace />;
    return <StudentDashboard />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Platform Layout Wrap */}
      <Route element={<AppLayout />}>

        {/* Public & Common Protected Routes */}
        <Route index element={<DashboardRouter />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/courses/:courseId/learn" element={<CourseDetails />} />
        <Route path="/discussions" element={<Discussions />} />

        <Route path="/notifications" element={
          <RequireAuth><Notifications /></RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth><Profile /></RequireAuth>
        } />

        {/* STUDENT ROUTES */}
        <Route path="/my-learning" element={
          <RequireAuth allowedRoles={['Student']}><MyLearning /></RequireAuth>
        } />
        <Route path="/lessons" element={
          <RequireAuth allowedRoles={['Student']}><Lessons /></RequireAuth>
        } />
        <Route path="/quizzes" element={
          <RequireAuth allowedRoles={['Student']}><Quizzes /></RequireAuth>
        } />
        <Route path="/progress" element={
          <RequireAuth allowedRoles={['Student']}><Progress /></RequireAuth>
        } />
        <Route path="/payments" element={
          <RequireAuth allowedRoles={['Student']}><Payments /></RequireAuth>
        } />
        <Route path="/enrollments" element={
          <RequireAuth allowedRoles={['Student']}><Enrollments /></RequireAuth>
        } />

        {/* INSTRUCTOR ROUTES */}
        <Route path="/instructor" element={
          <RequireAuth allowedRoles={['Instructor']}><InstructorDashboard /></RequireAuth>
        } />
        <Route path="/instructor/courses" element={
          <RequireAuth allowedRoles={['Instructor']}><InstructorCourses /></RequireAuth>
        } />
        <Route path="/instructor/create" element={
          <RequireAuth allowedRoles={['Instructor']}><CreateCourse /></RequireAuth>
        } />
        <Route path="/instructor/courses/:courseId/edit" element={
          <RequireAuth allowedRoles={['Instructor']}><CreateCourse /></RequireAuth>
        } />
        <Route path="/instructor/quizzes" element={
          <RequireAuth allowedRoles={['Instructor']}><InstructorQuizBuilder /></RequireAuth>
        } />
        <Route path="/instructor/students" element={
          <RequireAuth allowedRoles={['Instructor']}><InstructorStudents /></RequireAuth>
        } />
        <Route path="/instructor/analytics" element={
          <RequireAuth allowedRoles={['Instructor']}><InstructorAnalytics /></RequireAuth>
        } />
        <Route path="/instructor/forums" element={
          <RequireAuth allowedRoles={['Instructor']}><Discussions /></RequireAuth>
        } />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={
          <RequireAuth allowedRoles={['Admin']}><AdminDashboard /></RequireAuth>
        } />
        <Route path="/admin/users" element={
          <RequireAuth allowedRoles={['Admin']}><AdminUsers /></RequireAuth>
        } />
        <Route path="/admin/courses" element={
          <RequireAuth allowedRoles={['Admin']}><AdminCourses /></RequireAuth>
        } />
        <Route path="/admin/payments" element={
          <RequireAuth allowedRoles={['Admin']}><AdminPayments /></RequireAuth>
        } />
        <Route path="/admin/analytics" element={
          <RequireAuth allowedRoles={['Admin']}><AdminAnalytics /></RequireAuth>
        } />
        <Route path="/admin/settings" element={
          <RequireAuth allowedRoles={['Admin']}><AdminSettings /></RequireAuth>
        } />
        <Route path="/admin/certificates" element={
          <RequireAuth allowedRoles={['Admin']}><AdminCertificates /></RequireAuth>
        } />
        <Route path="/admin/notifications" element={
          <RequireAuth allowedRoles={['Admin']}><AdminNotifications /></RequireAuth>
        } />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
