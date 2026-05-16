import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { register } from './plugins/registry';
import { docsPlugin, docsSubtreePlugin } from './plugins/docs';
import { defaultPlugin } from './plugins/default';
import './index.css';

// Plugin registration order matters: more specific first; default plugin
// must be LAST so it acts as the catch-all fallback.
register(docsPlugin);
register(docsSubtreePlugin);
register(defaultPlugin);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        <main className="dark text-foreground bg-background h-full">
          <RouterProvider router={router} />
        </main>
      </QueryClientProvider>
    </HeroUIProvider>
  </StrictMode>,
);
