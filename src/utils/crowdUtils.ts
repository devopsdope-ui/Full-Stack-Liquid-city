import type { Crowd } from '../types';

export function crowdColorClass(pct: number): string {
  if (pct >= 90) return 'text-status-crowded';
  if (pct >= 70) return 'text-status-moderate';
  return 'text-status-available';
}

export function crowdBgClass(pct: number): string {
  if (pct >= 90) return 'bg-status-crowded';
  if (pct >= 70) return 'bg-status-moderate';
  return 'bg-status-available';
}

export function crowdBorderClass(status: string): string {
  switch (status) {
    case 'CRITICAL': return 'border-red-300 bg-red-50';
    case 'HIGH': return 'border-red-200 bg-red-50/50';
    case 'MODERATE': return 'border-yellow-200 bg-yellow-50/50';
    default: return 'border-city-border bg-white';
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NORMAL: '🟢 NORMAL', MODERATE: '🟡 MODERATE', HIGH: '🟠 HIGH', CRITICAL: '🔴 CRITICAL',
  };
  return map[status] || status;
}

export function minutesAgo(timestamp: string): string {
  const diff = (Date.now() - new Date(timestamp).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return 'No wait';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function occupancyToStatus(pct: number): Crowd['status'] {
  if (pct >= 95) return 'CRITICAL';
  if (pct >= 80) return 'HIGH';
  if (pct >= 60) return 'MODERATE';
  return 'NORMAL';
}
