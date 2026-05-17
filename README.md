# EduLearn Frontend

React + Vite frontend for the EduLearn Spring microservice backend.

## Run

```bash
npm install
npm run dev
```

The app reads the gateway URL from `VITE_API_BASE_URL`. By default it uses `http://localhost:8080`.

## Structure

```text
src/
  api/          API client and service modules
  components/   Shared layout and UI components
  context/      Auth/session state
  pages/        Route-level screens
  routes/       App route definitions
  styles/       Global CSS
  utils/        Small helpers
```
