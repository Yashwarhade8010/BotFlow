import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import ForgotPassword   from './pages/ForgotPassword';
import OnboardingPage   from './pages/OnboardingPage';
import DashboardPage    from './pages/DashboardPage';
import LandingPage      from './pages/LandingPage';

function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/signup"    element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/dashboard/*" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
