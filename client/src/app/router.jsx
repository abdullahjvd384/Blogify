import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGate } from '@/components/AuthGate';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Lazy-loaded pages — each becomes its own JS chunk so the initial bundle stays
// small (the heavy writer editor / admin code only loads when those routes open).
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const SignupPage = lazy(() => import('@/pages/public/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/public/VerifyEmailPage'));
const PricingPage = lazy(() => import('@/pages/public/PricingPage'));
const PaymentReturnPage = lazy(() => import('@/pages/public/PaymentReturnPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const TermsPage = lazy(() => import('@/pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'));
const GuidelinesPage = lazy(() => import('@/pages/public/GuidelinesPage'));
const HelpPage = lazy(() => import('@/pages/public/HelpPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));
const FeedPage = lazy(() => import('@/pages/reader/FeedPage'));
const ArticlePage = lazy(() => import('@/pages/reader/ArticlePage'));
const ProfilePage = lazy(() => import('@/pages/reader/ProfilePage'));
const FollowingFeedPage = lazy(() => import('@/pages/reader/FollowingFeedPage'));
const TagPage = lazy(() => import('@/pages/reader/TagPage'));
const SearchPage = lazy(() => import('@/pages/reader/SearchPage'));
const DraftsPage = lazy(() => import('@/pages/writer/DraftsPage'));
const EditorPage = lazy(() => import('@/pages/writer/EditorPage'));
const StatsPage = lazy(() => import('@/pages/writer/StatsPage'));
const EarningsPage = lazy(() => import('@/pages/writer/EarningsPage'));
const ModerationPage = lazy(() => import('@/pages/admin/ModerationPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const PaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'));
const PayoutsPage = lazy(() => import('@/pages/admin/PayoutsPage'));
const WithdrawalsPage = lazy(() => import('@/pages/admin/WithdrawalsPage'));
const SubscriptionPage = lazy(() => import('@/pages/account/SubscriptionPage'));
const SettingsPage = lazy(() => import('@/pages/account/SettingsPage'));
const SavedPage = lazy(() => import('@/pages/account/SavedPage'));
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'));

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
      { path: '/tag/:tag', element: <TagPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/guidelines', element: <GuidelinesPage /> },
      { path: '/help', element: <HelpPage /> },
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
      { path: '/writer/stats', element: <StatsPage /> },
      { path: '/writer/earnings', element: <EarningsPage /> },
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
      { path: '/notifications', element: <NotificationsPage /> },
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
      { path: '/admin/payouts', element: <PayoutsPage /> },
      { path: '/admin/withdrawals', element: <WithdrawalsPage /> },
    ],
  },
]);
