import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-city-border">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32 ml-auto" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16 mt-1" />
      <Skeleton className="h-2 w-24 mt-1" />
    </div>
  );
}
