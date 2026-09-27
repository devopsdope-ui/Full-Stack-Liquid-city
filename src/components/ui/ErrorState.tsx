import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import type { ApiError } from '../../types';

interface ErrorStateProps {
  error?: ApiError | null;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, message: customMessage, onRetry, compact }: ErrorStateProps) {
  const message = customMessage || error?.message || 'Something went wrong.';
  const isOffline = error?.status === 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-100">
        <AlertTriangle size={14} className="shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-auto text-red-600 hover:text-red-800">
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
        {isOffline ? (
          <WifiOff size={20} className="text-red-500" />
        ) : (
          <AlertTriangle size={20} className="text-red-500" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-city-charcoal">{message}</p>
        {error?.detail && (
          <p className="text-xs text-city-muted mt-1">{error.detail}</p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs gap-1.5">
          <RefreshCw size={12} />
          Try again
        </button>
      )}
    </div>
  );
}
