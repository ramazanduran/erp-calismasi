'use client';

import { Menu, Bell, Search, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import type { AuthUser } from '@erp/shared-types';

interface TopBarProps {
  onMenuClick: () => void;
  user: AuthUser;
}

export function TopBar({ onMenuClick, user }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
      {/* Menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Ara... (Ctrl+K)</span>
          <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-input bg-muted px-1.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                getInitials(user.firstName, user.lastName)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profil
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Ayarlar
                </Link>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors'
                    )}
                    onClick={() => {
                      setUserMenuOpen(false);
                      // TODO: logout
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Command palette placeholder */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Ne aramak istiyorsunuz?"
                onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              />
              <kbd
                className="text-xs text-muted-foreground cursor-pointer"
                onClick={() => setSearchOpen(false)}
              >
                ESC
              </kbd>
            </div>
            <div className="p-4 text-sm text-muted-foreground text-center py-8">
              Arama sonuçları burada görünecek
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
