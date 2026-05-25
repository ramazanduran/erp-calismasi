'use client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
}

export function BulkActionsBar({ selectedCount, onClearSelection, actions }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-card shadow-lg px-4 py-3">
      <span className="text-sm font-medium">{selectedCount} öğe seçildi</span>
      <div className="h-4 w-px bg-border" />
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick}
          className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            action.variant === 'danger' ? 'text-destructive hover:bg-destructive/10' : 'hover:bg-muted')}>
          {action.icon}
          {action.label}
        </button>
      ))}
      <div className="h-4 w-px bg-border" />
      <button onClick={onClearSelection} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
