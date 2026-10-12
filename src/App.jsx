import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import Layout from '@/components/Layout';
import { LanguageProvider } from '@/lib/i18n';
// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Customer pages
import Home from '@/pages/Home';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Booking from '@/pages/Booking';
import MyBookings from '@/pages/MyBookings';
import CustomEventRequest from '@/pages/CustomEventRequest';
import MyEventRequests from '@/pages/MyEventRequests';
import EventRequestDetail from '@/pages/EventRequestDetail';
import Account from '@/pages/Account';
// Admin
import AdminDashboard from '@/pages/AdminDashboard';
import AdminOverview from '@/pages/admin/Overview';
import EventsAdmin from '@/pages/admin/EventsAdmin';
import BookingsAdmin from '@/pages/admin/BookingsAdmin';
import RequestsAdmin from '@/pages/admin/RequestsAdmin';
import RequestDetailAdmin from '@/pages/admin/RequestDetailAdmin';
import UsersAdmin from '@/pages/admin/UsersAdmin';
import ContactAdmin from '@/pages/admin/ContactAdmin';
// Organizer
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import OrganizerOverview from '@/pages/organizer/OrganizerOverview';
import OrganizerEventDetail from '@/pages/organizer/OrganizerEventDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/custom-request" element={<CustomEventRequest />} />
          <Route path="/my-requests" element={<MyEventRequests />} />
          <Route path="/requests/:id" element={<EventRequestDetail />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="events" element={<EventsAdmin />} />
          <Route path="bookings" element={<BookingsAdmin />} />
          <Route path="requests" element={<RequestsAdmin />} />
          <Route path="requests/:id" element={<RequestDetailAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="contact" element={<ContactAdmin />} />
        </Route>
        <Route path="/organizer" element={<RoleRoute roles={['organizer']}><OrganizerDashboard /></RoleRoute>}>
          <Route index element={<OrganizerOverview />} />
          <Route path=":id" element={<OrganizerEventDetail />} />
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
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App