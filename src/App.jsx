import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import AdminRoute from '@/components/AdminRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import Schedule from '@/pages/Schedule';
import Providers from '@/pages/Providers';
import ProviderProfile from '@/pages/ProviderProfile';
import ProviderProfileEdit from '@/pages/ProviderProfileEdit';
import GetPass from '@/pages/GetPass';
import Pass from '@/pages/Pass';
import CharityPick from '@/pages/CharityPick';
import Gift from '@/pages/Gift';
import Me from '@/pages/Me';
import CheckIn from '@/pages/CheckIn';
import Feedback from '@/pages/Feedback';
import Admin from '@/pages/Admin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="providers" element={<Providers />} />
          <Route path="providers/:id" element={<ProviderProfile />} />
          <Route path="provider/profile" element={<ProviderProfileEdit />} />
          <Route path="pass/new" element={<GetPass />} />
          <Route path="pass" element={<Pass />} />
          <Route path="cause" element={<CharityPick />} />
          <Route path="gift" element={<Gift />} />
          <Route path="me" element={<Me />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="feedback" element={<Feedback />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Admin />} />
            <Route path="admin/guests" element={<Admin initialTab="guests" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App