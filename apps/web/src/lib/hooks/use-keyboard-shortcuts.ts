import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Ctrl/Cmd + K → Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLElement>('[data-search-input]')?.click();
        return;
      }

      // G + D → Dashboard
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'g') {
          pendingKey.current = 'g';
          if (pendingTimer.current) clearTimeout(pendingTimer.current);
          pendingTimer.current = setTimeout(() => { pendingKey.current = null; }, 1000);
          return;
        }
        if (pendingKey.current === 'g') {
          pendingKey.current = null;
          if (pendingTimer.current) clearTimeout(pendingTimer.current);
          if (e.key === 'd') { e.preventDefault(); router.push('/'); }
          if (e.key === 's') { e.preventDefault(); router.push('/sales/customers'); }
          if (e.key === 'i') { e.preventDefault(); router.push('/inventory/products'); }
          if (e.key === 'h') { e.preventDefault(); router.push('/hr/employees'); }
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [router]);
}
