import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GraphsListPage } from './pages/GraphsList';
import { GraphViewPage } from './pages/GraphView';
import { NotFoundPage } from './pages/NotFound';

export const router = createBrowserRouter([
  { path: '/', element: <GraphsListPage /> },
  { path: '/graphs', element: <Navigate to="/" replace /> },
  { path: '/graphs/:graphId', element: <GraphViewPage /> },
  { path: '/graphs/:graphId/nodes/:lineageId', element: <GraphViewPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
