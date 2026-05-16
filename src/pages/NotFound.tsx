import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';

export function NotFoundPage() {
  return (
    <AppShell>
      <div className="h-full flex items-center justify-center text-default-500">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Not found</h2>
          <Link to="/" className="text-primary text-sm hover:underline">
            Back to graphs
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
