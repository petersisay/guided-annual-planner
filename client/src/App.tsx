import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { MissingGoogleConfigCard } from './components/auth/MissingGoogleConfigCard';
import { PaperPageSpinner } from './components/common/PaperPageSpinner';
import { PwaUpdatePrompt } from './components/common/PwaUpdatePrompt';
import { register } from './serviceWorkerRegistration';

// Lazy-loaded route components for optimal initial bundle performance
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const CreatorStoryPage = lazy(() =>
  import('./pages/CreatorStoryPage').then((m) => ({ default: m.CreatorStoryPage }))
);
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AnnualViewPage = lazy(() =>
  import('./pages/AnnualViewPage').then((m) => ({ default: m.AnnualViewPage }))
);
const MonthlyViewPage = lazy(() =>
  import('./pages/MonthlyViewPage').then((m) => ({ default: m.MonthlyViewPage }))
);
const WeeklyViewPage = lazy(() =>
  import('./pages/WeeklyViewPage').then((m) => ({ default: m.WeeklyViewPage }))
);
const DailyViewPage = lazy(() =>
  import('./pages/DailyViewPage').then((m) => ({ default: m.DailyViewPage }))
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
        <img
          src="/images/gp-monogram.png"
          alt="Guided Annual Planner"
          className="w-14 h-14 object-contain animate-pulse motion-reduce:animate-none mb-3"
        />
        <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-3" />
        <p className="font-serif text-sm text-ink-muted">Opening your journal...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const [waitingRegistration, setWaitingRegistration] = useState<ServiceWorkerRegistration | null>(
    null
  );

  useEffect(() => {
    register({
      onUpdate: (registration) => {
        setWaitingRegistration(registration);
      },
    });
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PaperPageSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<CreatorStoryPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Planner & User Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/annual"
            element={
              <ProtectedRoute>
                <AnnualViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly/:year/:month"
            element={
              <ProtectedRoute>
                <MonthlyViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weekly/:year/:week"
            element={
              <ProtectedRoute>
                <WeeklyViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily/:date?"
            element={
              <ProtectedRoute>
                <DailyViewPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <PwaUpdatePrompt
        registration={waitingRegistration}
        onDismiss={() => setWaitingRegistration(null)}
      />
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  // If no Google Client ID is configured, show the clean configuration notice without crashing
  if (!googleClientId) {
    return <MissingGoogleConfigCard />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
