import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, title, description, icon, action, actionLabel, onAction }: EmptyStateProps) {
  const displayTitle = title || message || 'No data found';
  const displayDesc = description || (title ? message : undefined);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-beige-200 flex items-center justify-center border border-city-border">
        {icon || <InboxIcon size={20} className="text-city-muted" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-city-dark">{displayTitle}</p>
        {displayDesc && <p className="text-xs text-city-muted mt-1">{displayDesc}</p>}
      </div>
      {action ? (
        <div>{action}</div>
      ) : actionLabel && onAction ? (
        <button onClick={onAction} className="btn-primary text-xs mt-2">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
