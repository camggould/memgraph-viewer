import { useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { Link } from 'react-router-dom';
import { SettingsModal } from './SettingsModal';
import { useInfo } from '@/api/hooks';
import { getApiToken, getApiUrl } from '@/api/client';

export type AuthState = 'ok' | 'denied' | 'no-token';

export function AppShell({
  sidebar,
  children,
  authState = 'ok',
}: {
  sidebar?: ReactNode;
  children: ReactNode;
  authState?: AuthState;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const info = useInfo();
  const apiUrl = getApiUrl() || '(same-origin)';
  const tokenSet = !!getApiToken();

  const lockColor =
    authState === 'denied'
      ? 'text-danger'
      : authState === 'ok' && tokenSet
        ? 'text-success'
        : 'text-default-400';

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 px-4 h-12 border-b border-divider bg-content1">
        <Link to="/" className="font-semibold tracking-tight">
          memgraph<span className="text-default-400">·viewer</span>
        </Link>
        <span className="mono text-xs text-default-500 truncate">{apiUrl}</span>
        {info.data && (
          <span className="mono text-xs text-default-400">
            v{info.data.version} · {info.data.store}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className={`mono text-xs ${lockColor}`} title={`auth: ${authState}`}>
            {tokenSet ? '🔒' : '🔓'}
          </span>
          <Button size="sm" variant="flat" onPress={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </div>
      </header>
      <div className="flex-1 flex min-h-0">
        {sidebar && (
          <aside className="w-[240px] border-r border-divider bg-content1 overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 min-w-0 relative">{children}</main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
