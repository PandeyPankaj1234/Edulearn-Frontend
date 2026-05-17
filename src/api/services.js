import { apiClient } from './client';

const qs = (params) => new URLSearchParams(params).toString();

export const authApi = {
  login: (data) => apiClient.post('/api/auth/login', data),
  register: (data) => apiClient.post('/api/auth/register', data),
  profile: (email) => apiClient.get(`/api/auth/profile?${qs({ email })}`),
  updateProfile: (userId, data) => apiClient.put(`/api/auth/profile/${userId}`, data),
  changePassword: (userId, newPassword) => apiClient.put(`/api/auth/password/${userId}?${qs({ newPassword })}`),
  deleteAccount: (userId) => apiClient.delete(`/api/auth/delete/${userId}`),
  // Admin
  getAllUsers: () => apiClient.get('/api/auth/admin/users'),
  getUsersByRole: (role) => apiClient.get(`/api/auth/admin/users/role/${role}`),
  suspendUser: (userId) => apiClient.put(`/api/auth/admin/users/${userId}/suspend`),
  searchUsers: (name) => apiClient.get(`/api/auth/admin/users/search?${qs({ name })}`),
};

export const courseApi = {
  all: () => apiClient.get('/api/courses'),
  featured: () => apiClient.get('/api/courses/featured'),
  search: (keyword) => apiClient.get(`/api/courses/search?${qs({ keyword })}`),
  byId: (courseId) => apiClient.get(`/api/courses/${courseId}`),
  byInstructor: (instructorId) => apiClient.get(`/api/courses/instructor/${instructorId}`),
  create: (data) => apiClient.post('/api/courses', data),
  update: (courseId, data) => apiClient.put(`/api/courses/${courseId}`, data),
  publish: (courseId) => apiClient.put(`/api/courses/${courseId}/publish`),
  delete: (courseId) => apiClient.delete(`/api/courses/${courseId}`),
  // Approval workflow
  submitForReview: (courseId) => apiClient.put(`/api/courses/${courseId}/submit-review`),
  approveCourse: (courseId) => apiClient.put(`/api/courses/${courseId}/approve`),
  rejectCourse: (courseId, reason) => apiClient.put(`/api/courses/${courseId}/reject?${qs({ reason })}`),
  byApprovalStatus: (status) => apiClient.get(`/api/courses/admin/approval-status?${qs({ status })}`),
};

export const lessonApi = {
  byCourse: (courseId) => apiClient.get(`/api/lessons/course/${courseId}`),
  preview: (courseId) => apiClient.get(`/api/lessons/course/${courseId}/preview`),
  create: (data) => apiClient.post('/api/lessons', data),
  update: (lessonId, data) => apiClient.put(`/api/lessons/${lessonId}`, data),
  delete: (lessonId) => apiClient.delete(`/api/lessons/${lessonId}`),
  resources: (lessonId) => apiClient.get(`/api/lessons/${lessonId}/resources`),
};

export const enrollmentApi = {
  enroll: (data) => apiClient.post('/api/enrollments', data),
  byStudent: (studentId) => apiClient.get(`/api/enrollments/student/${studentId}`),
  byCourse: (courseId) => apiClient.get(`/api/enrollments/course/${courseId}`),
  all: () => apiClient.get('/api/enrollments/all'),
  check: (studentId, courseId) => apiClient.get(`/api/enrollments/check?${qs({ studentId, courseId })}`),
  updateProgress: (enrollmentId, progressPercent) => apiClient.put(
    `/api/enrollments/${enrollmentId}/progress?${qs({ progressPercent })}`
  ),
  unenroll: (enrollmentId) => apiClient.put(`/api/enrollments/${enrollmentId}/unenroll`),
};

export const quizApi = {
  byCourse: (courseId) => apiClient.get(`/api/quizzes/course/${courseId}`),
  questions: (quizId) => apiClient.get(`/api/quizzes/${quizId}/questions`),
  create: (data) => apiClient.post('/api/quizzes', data),
  addQuestion: (data) => apiClient.post('/api/quizzes/questions', data),
  update: (quizId, data) => apiClient.put(`/api/quizzes/${quizId}`, data),
  publish: (quizId) => apiClient.put(`/api/quizzes/${quizId}/publish`),
  delete: (quizId) => apiClient.delete(`/api/quizzes/${quizId}`),
  start: (quizId, studentId) => apiClient.post(`/api/attempts/start?${qs({ quizId, studentId })}`),
  submit: (data) => apiClient.post('/api/attempts/submit', data),
  attemptsByStudent: (studentId) => apiClient.get(`/api/attempts/student/${studentId}`),
  attemptsByQuiz: (quizId) => apiClient.get(`/api/attempts/quiz/${quizId}`),
  attemptCount: (studentId, quizId) => apiClient.get(`/api/attempts/count?${qs({ studentId, quizId })}`),
  bestScore: (studentId, quizId) => apiClient.get(`/api/attempts/best-score?${qs({ studentId, quizId })}`),
};

export const progressApi = {
  allByStudent: (studentId) => apiClient.get(`/api/progress/student/${studentId}`),
  track: (data) => apiClient.post('/api/progress/track', data),
  completeLesson: (studentId, lessonId) => apiClient.put(`/api/progress/complete?${qs({ studentId, lessonId })}`),
  courseProgress: (studentId, courseId, totalLessons) =>
    apiClient.get(`/api/progress/course?${qs({ studentId, courseId, totalLessons })}`),
  lessonProgress: (studentId, lessonId) =>
    apiClient.get(`/api/progress/lesson?${qs({ studentId, lessonId })}`),
  certificates: (studentId) => apiClient.get(`/api/progress/certificates/student/${studentId}`),
  allCertificates: () => apiClient.get('/api/progress/certificates/all'),
  getCertificate: (studentId, courseId) =>
    apiClient.get(`/api/progress/certificates?${qs({ studentId, courseId })}`),
  issueCertificate: (params) => apiClient.post(`/api/progress/certificates/issue?${qs(params)}`),
  verifyCertificate: (code) => apiClient.get(`/api/progress/certificates/verify/${code}`),
};

export const discussionApi = {
  threadsByCourse: (courseId) => apiClient.get(`/api/discussions/threads/course/${courseId}`),
  threadsByLesson: (lessonId) => apiClient.get(`/api/discussions/threads/lesson/${lessonId}`),
  threadsByAuthor: (authorId) => apiClient.get(`/api/discussions/threads/author/${authorId}`),
  searchThreads: (keyword) => apiClient.get(`/api/discussions/threads/search?${qs({ keyword })}`),
  createThread: (data) => apiClient.post('/api/discussions/threads', data),
  pinThread: (threadId) => apiClient.put(`/api/discussions/threads/${threadId}/pin`),
  closeThread: (threadId) => apiClient.put(`/api/discussions/threads/${threadId}/close`),
  deleteThread: (threadId) => apiClient.delete(`/api/discussions/threads/${threadId}`),
  replies: (threadId) => apiClient.get(`/api/discussions/replies/thread/${threadId}`),
  replyCount: (threadId) => apiClient.get(`/api/discussions/replies/thread/${threadId}/count`),
  reply: (data) => apiClient.post('/api/discussions/replies', data),
  upvoteReply: (replyId) => apiClient.put(`/api/discussions/replies/${replyId}/upvote`),
  acceptReply: (replyId) => apiClient.put(`/api/discussions/replies/${replyId}/accept`),
  deleteReply: (replyId) => apiClient.delete(`/api/discussions/replies/${replyId}`),
};

export const paymentApi = {
  process: (data) => apiClient.post('/api/payments/process', data),
  byStudent: (studentId) => apiClient.get(`/api/payments/student/${studentId}`),
  byCourse: (courseId) => apiClient.get(`/api/payments/course/${courseId}`),
  refund: (paymentId) => apiClient.put(`/api/payments/${paymentId}/refund`),
  revenue: () => apiClient.get('/api/payments/revenue'),
  allPayments: () => apiClient.get('/api/payments/all'),
  subscribe: (data) => apiClient.post('/api/payments/subscribe', data),
  cancelSubscription: (subscriptionId) =>
    apiClient.put(`/api/payments/subscriptions/${subscriptionId}/cancel`),
  refundSubscription: (subscriptionId) =>
    apiClient.put(`/api/payments/subscriptions/${subscriptionId}/refund`),
  renewSubscription: (subscriptionId) =>
    apiClient.put(`/api/payments/subscriptions/${subscriptionId}/renew`),
  getSubscription: (studentId) =>
    apiClient.get(`/api/payments/subscriptions/student/${studentId}`),
  isSubscriptionActive: (studentId) =>
    apiClient.get(`/api/payments/subscriptions/active/${studentId}`),
  allSubscriptions: () => apiClient.get('/api/payments/subscriptions/all'),
};

export const notificationApi = {
  send: (data) => apiClient.post('/api/notifications/send', data),
  sendBulk: (data) => apiClient.post('/api/notifications/send-bulk', data),
  byUser: (userId) => apiClient.get(`/api/notifications/user/${userId}`),
  unread: (userId) => apiClient.get(`/api/notifications/user/${userId}/unread`),
  unreadCount: (userId) => apiClient.get(`/api/notifications/user/${userId}/count`),
  markRead: (notificationId) => apiClient.put(`/api/notifications/${notificationId}/read`),
  markAllRead: (userId) => apiClient.put(`/api/notifications/user/${userId}/read-all`),
  delete: (notificationId) => apiClient.delete(`/api/notifications/${notificationId}`),
  all: () => apiClient.get('/api/notifications/all'),
  sendEmail: (toEmail, subject, body) =>
    apiClient.post(`/api/notifications/email?${qs({ toEmail, subject, body })}`),
};
