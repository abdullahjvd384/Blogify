import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGate } from '@/components/AuthGate';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import SignupPage from '@/pages/public/SignupPage';
import ForgotPasswordPage from '@/pages/public/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/ResetPasswordPage';
import VerifyEmailPage from '@/pages/public/VerifyEmailPage';
import PricingPage from '@/pages/public/PricingPage';
import PaymentReturnPage from '@/pages/public/PaymentReturnPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import FeedPage from '@/pages/reader/FeedPage';
import ArticlePage from '@/pages/reader/ArticlePage';
import ProfilePage from '@/pages/reader/ProfilePage';
import FollowingFeedPage from '@/pages/reader/FollowingFeedPage';
import DraftsPage from '@/pages/writer/DraftsPage';
import EditorPage from '@/pages/writer/EditorPage';
import ModerationPage from '@/pages/admin/ModerationPage';
import UsersPage from '@/pages/admin/UsersPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import SubscriptionPage from '@/pages/account/SubscriptionPage';
import SettingsPage from '@/pages/account/SettingsPage';
import SavedPage from '@/pages/account/SavedPage';

export const router = createBrowserRouter([
  {
    element: (
      <AuthGate>
        <PublicLayout />
      </AuthGate>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/articles', element: <FeedPage /> },
      { path: '/articles/:slug', element: <ArticlePage /> },
      { path: '/u/:handle', element: <ProfilePage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/payments/return', element: <PaymentReturnPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: (
      <AuthGate>
        <ProtectedRoute role="writer">
          <AppLayout />
        </ProtectedRoute>
      </AuthGate>
    ),
    children: [
      { path: '/writer', element: <Navigate to="/writer/drafts" replace /> },
      { path: '/writer/drafts', element: <DraftsPage /> },
      { path: '/writer/new', element: <EditorPage /> },
      { path: '/writer/edit/:id', element: <EditorPage /> },
    ],
  },
  // Authenticated-but-no-role routes (account settings, subscription, etc.)
  {
    element: (
      <AuthGate>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </AuthGate>
    ),
    children: [
      { path: '/account', element: <Navigate to="/account/settings" replace /> },
      { path: '/account/settings', element: <SettingsPage /> },
      { path: '/account/subscription', element: <SubscriptionPage /> },
      { path: '/following', element: <FollowingFeedPage /> },
      { path: '/saved', element: <SavedPage /> },
    ],
  },
  {
    element: (
      <AuthGate>
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      </AuthGate>
    ),
    children: [
      { path: '/admin', element: <Navigate to="/admin/moderation" replace /> },
      { path: '/admin/moderation', element: <ModerationPage /> },
      { path: '/admin/users', element: <UsersPage /> },
      { path: '/admin/payments', element: <PaymentsPage /> },
    ],
  },
]);
