'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { Breadcrumb } from './breadcrumb';
import type { AuthUser } from '@erp/shared-types';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

interface AppShellProps {
  children: React.ReactNode;
  user: AuthUser;
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={!sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        user={user}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => {
            setSidebarOpen((v) => !v);
            setMobileSidebarOpen((v) => !v);
          }}
          user={user}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-screen-2xl">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
