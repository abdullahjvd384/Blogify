import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGate } from '@/components/AuthGate';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import SignupPage from '@/pages/public/SignupPage';
import PricingPage from '@/pages/public/PricingPage';
import FeedPage from '@/pages/reader/FeedPage';
import ArticlePage from '@/pages/reader/ArticlePage';
import DraftsPage from '@/pages/writer/DraftsPage';
import EditorPage from '@/pages/writer/EditorPage';
import ModerationPage from '@/pages/admin/ModerationPage';

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
      { path: '/pricing', element: <PricingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: (
      <AuthGate>
        <ProtectedRoute>
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
    ],
  },
  {
    path: '*',
    element: (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="mt-2 text-sm text-slate-500">Page not found.</p>
      </div>
    ),
  },
]);
