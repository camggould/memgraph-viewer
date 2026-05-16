import { AppShell } from '@/components/AppShell';
import { GraphsList as GraphsListSidebar } from '@/components/GraphsList';

export function GraphsListPage() {
  return (
    <AppShell sidebar={<GraphsListSidebar />}>
      <div className="h-full flex items-center justify-center text-default-500">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-medium mb-2">Select a graph</h2>
          <p className="text-sm">
            Pick a graph from the sidebar to explore its nodes and edges. If the list is empty,
            create one via the REST API (<span className="mono">POST /v1/graphs</span>) or check
            that the server is reachable in Settings.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
