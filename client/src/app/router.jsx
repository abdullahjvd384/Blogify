import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/public/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);
