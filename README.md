# EduLearn Frontend

A full-featured e-learning platform frontend built with **React 19** and **Vite**, designed to work with the EduLearn Spring Boot microservice backend.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [User Roles & Portals](#user-roles--portals)
- [Routing](#routing)
- [API Layer](#api-layer)
- [Authentication](#authentication)
- [Payments](#payments)
- [Available Scripts](#available-scripts)

---

## Overview

EduLearn is a multi-role learning management system (LMS) that supports three distinct user types — **Students**, **Instructors**, and **Admins** — each with their own dashboards, navigation, and feature set. The platform covers the full course lifecycle: browsing, enrollment, learning, quizzes, progress tracking, payments, certificates, discussions, and admin oversight.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.0.0 | UI framework |
| Vite | ^6.0.5 | Build tool & dev server |
| React Router DOM | ^7.1.1 | Client-side routing |
| @react-oauth/google | ^0.13.5 | Google OAuth sign-in |
| lucide-react | ^0.468.0 | Icon library |
| Razorpay | (CDN via hook) | Payment gateway |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- EduLearn backend running (defaults to `http://localhost:8080`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd edulearn-Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend API gateway URL (defaults to http://localhost:8080 if not set)
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth Client ID (required for Google sign-in)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Razorpay Key ID (optional; falls back to a mock payment UI if not set)
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

> **Note:** The Vite dev server is configured with `Cross-Origin-Opener-Policy: same-origin-allow-popups` to allow the Google OAuth popup to communicate back to the parent window.

---

## Project Structure

```
src/
├── api/
│   ├── client.js          # Base HTTP client (fetch wrapper with JWT auth)
│   └── services.js        # API service modules grouped by domain
│
├── components/
│   ├── AppLayout.jsx      # Root layout with role-based sidebar navigation
│   ├── CourseCard.jsx     # Reusable course card component
│   ├── EmptyState.jsx     # Empty state placeholder component
│   └── Loading.jsx        # Loading spinner component
│
├── context/
│   └── AuthContext.jsx    # Global auth state (user, login, logout, roles)
│
├── hooks/
│   └── useRazorpay.jsx    # Razorpay payment hook with mock fallback UI
│
├── pages/
│   ├── Login.jsx          # Login page (email/password + Google OAuth)
│   ├── Register.jsx       # Registration page
│   ├── Courses.jsx        # Public course catalog
│   ├── CourseDetails.jsx  # Course detail and in-course learning view
│   ├── Discussions.jsx    # Course discussion forums
│   ├── Notifications.jsx  # User notifications
│   ├── Profile.jsx        # User profile management
│   │
│   ├── # --- Student Pages ---
│   ├── StudentDashboard.jsx
│   ├── MyLearning.jsx     # Enrolled courses list
│   ├── Lessons.jsx        # Lesson viewer
│   ├── Quizzes.jsx        # Quiz taking interface
│   ├── Progress.jsx       # Learning progress & certificates
│   ├── Payments.jsx       # Payment history & subscriptions
│   ├── Enrollments.jsx    # Enrollment management
│   │
│   ├── # --- Instructor Pages ---
│   ├── InstructorDashboard.jsx
│   ├── InstructorCourses.jsx   # Course listing and management
│   ├── CreateCourse.jsx        # Course creation / editing form
│   ├── InstructorQuizBuilder.jsx
│   ├── InstructorStudents.jsx  # Enrolled students overview
│   ├── InstructorAnalytics.jsx
│   │
│   └── # --- Admin Pages ---
│       ├── AdminDashboard.jsx
│       ├── AdminUsers.jsx          # User management & suspension
│       ├── AdminCourses.jsx        # Course approval workflow
│       ├── AdminPayments.jsx       # Revenue & refund management
│       ├── AdminAnalytics.jsx
│       ├── AdminCertificates.jsx
│       ├── AdminNotifications.jsx  # Bulk notification sender
│       └── AdminSettings.jsx
│
├── routes/
│   └── AppRoutes.jsx      # All route definitions with role-based guards
│
├── styles/
│   └── global.css         # Global CSS styles
│
├── utils/
│   └── formatters.js      # Helpers: currency (INR), duration (min/hr)
│
└── main.jsx               # App entry point
```

---

## User Roles & Portals

The app supports three roles, each routed to a dedicated experience:

### Student
Default role after registration. Access includes:
- Browse the public course catalog and enroll in courses
- View lessons, take quizzes, and track learning progress
- Manage payments, subscriptions, and view certificates
- Participate in course discussion forums

### Instructor
Access includes:
- Create, edit, and publish courses (with admin approval workflow)
- Build quizzes with a visual quiz builder
- Monitor enrolled students and course analytics
- Manage course discussion forums

### Admin
Full platform access including:
- User management (view, search by role, suspend accounts)
- Course approval/rejection workflow
- Payment and revenue oversight with refund management
- Platform-wide analytics
- Certificate issuance and verification
- Broadcast notifications to users

---

## Routing

Routes are defined in `src/routes/AppRoutes.jsx`. Protected routes use the `RequireAuth` guard which checks both authentication status and role. Unauthenticated users are redirected to `/login`; users accessing a route outside their role are redirected to their home dashboard.

| Path | Role | Page |
|---|---|---|
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/courses` | Public | Course Catalog |
| `/courses/:courseId` | Public | Course Details |
| `/discussions` | Public | Discussions |
| `/` | Student | Student Dashboard |
| `/my-learning` | Student | My Learning |
| `/lessons` | Student | Lessons |
| `/quizzes` | Student | Quizzes |
| `/progress` | Student | Progress |
| `/payments` | Student | Payments |
| `/enrollments` | Student | Enrollments |
| `/instructor` | Instructor | Instructor Dashboard |
| `/instructor/courses` | Instructor | My Courses |
| `/instructor/create` | Instructor | Create Course |
| `/instructor/courses/:id/edit` | Instructor | Edit Course |
| `/instructor/quizzes` | Instructor | Quiz Builder |
| `/instructor/students` | Instructor | Students |
| `/instructor/analytics` | Instructor | Analytics |
| `/admin` | Admin | Admin Dashboard |
| `/admin/users` | Admin | User Management |
| `/admin/courses` | Admin | Course Approvals |
| `/admin/payments` | Admin | Payments |
| `/admin/analytics` | Admin | Analytics |
| `/admin/certificates` | Admin | Certificates |
| `/admin/notifications` | Admin | Notifications |
| `/admin/settings` | Admin | Settings |
| `/profile` | Auth | Profile |
| `/notifications` | Auth | Notifications |

---

## API Layer

### `src/api/client.js`

A lightweight `fetch` wrapper that:
- Automatically attaches the `Authorization: Bearer <token>` header from `localStorage`
- Sets `Content-Type: application/json` for non-FormData requests
- Parses JSON or text responses depending on `Content-Type`
- Throws meaningful errors from backend response messages

```js
import { apiClient } from './api/client';

apiClient.get('/api/courses');
apiClient.post('/api/enrollments', { studentId, courseId });
apiClient.put('/api/courses/42/publish');
apiClient.delete('/api/lessons/7');
```

### `src/api/services.js`

Domain-grouped service modules that map to backend API endpoints:

| Module | Description |
|---|---|
| `authApi` | Login, register, profile, password, admin user management |
| `courseApi` | CRUD, search, publish, approval workflow |
| `lessonApi` | Lesson CRUD, resources, previews |
| `enrollmentApi` | Enroll, unenroll, progress updates |
| `quizApi` | Quiz/question CRUD, attempts, scores |
| `progressApi` | Track progress, mark complete, certificates |
| `discussionApi` | Threads and replies (pin, close, upvote, accept) |
| `paymentApi` | Process payments, refunds, subscriptions |
| `notificationApi` | Send, read, delete, bulk notifications |

---

## Authentication

Authentication state is managed globally via `AuthContext` (`src/context/AuthContext.jsx`).

- JWT tokens are stored in `localStorage` under `edulearn_token`
- The current user object is stored under `edulearn_user`
- Helper booleans are available: `isAuthenticated`, `isStudent`, `isInstructor`, `isAdmin`
- Google OAuth is supported via `@react-oauth/google`; use `loginWithToken(authResponse)` after receiving the backend token

**Development utility:** `mockLogin(role)` is available to instantly simulate a login as `'Student'`, `'Instructor'`, or `'Admin'` for UI testing without a running backend.

```js
const { user, login, logout, isAdmin, mockLogin } = useAuth();

// Force login as Admin for testing
mockLogin('Admin');
```

---

## Payments

The `useRazorpay` hook (`src/hooks/useRazorpay.jsx`) integrates Razorpay for course purchases and subscriptions.

- If `VITE_RAZORPAY_KEY_ID` is not set or is invalid, it automatically falls back to a **mock payment modal** that simulates card entry and a 1.5s processing delay — useful for development and testing without real credentials.
- Currency formatting uses `en-IN` locale (INR) via `src/utils/formatters.js`.

---

## Available Scripts

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production (outputs to /dist)
npm run build

# Preview the production build locally
npm run preview
```
