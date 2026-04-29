import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthGate } from '@/components/AuthGate';
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import SignupPage from '@/pages/public/SignupPage';
import FeedPage from '@/pages/reader/FeedPage';
import ArticlePage from '@/pages/reader/ArticlePage';

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
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      {
        path: '*',
        element: (
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="text-2xl font-semibold">404</h1>
            <p className="mt-2 text-sm text-slate-500">Page not found.</p>
          </div>
        ),
      },
    ],
  },
]);
