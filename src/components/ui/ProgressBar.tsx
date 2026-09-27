import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
}

function getBarColor(pct: number): string {
  if (pct >= 90) return 'bg-status-crowded';
  if (pct >= 70) return 'bg-status-moderate';
  return 'bg-status-available';
}

export function ProgressBar({ value, max = 100, className = '', showLabel }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`progress-bar ${className}`}>
      <div
        className={`progress-bar-fill ${getBarColor(pct)}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
      {showLabel && (
        <span className="sr-only">{Math.round(pct)}%</span>
      )}
    </div>
  );
}

interface CrowdStatusBadgeProps {
  status: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
}

export function CrowdStatusBadge({ status }: CrowdStatusBadgeProps) {
  const map: Record<string, string> = {
    NORMAL: 'badge-green',
    MODERATE: 'badge-yellow',
    HIGH: 'badge-red',
    CRITICAL: 'badge-red',
  };
  const dot: Record<string, string> = {
    NORMAL: 'bg-status-available',
    MODERATE: 'bg-status-moderate',
    HIGH: 'bg-status-crowded',
    CRITICAL: 'bg-status-crowded',
  };
  const cls = map[status] || 'badge-gray';
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
