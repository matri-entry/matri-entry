'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-indigo-600', sizeMap[size])} />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  );
}

// Skeleton components for loading states
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-3 w-24 shimmer rounded mb-2" />
          <div className="h-8 w-16 shimmer rounded" />
        </div>
        <div className="w-12 h-12 shimmer rounded-xl" />
      </div>
      <div className="h-3 w-32 shimmer rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-100">
          <div className="h-4 w-8 shimmer rounded" />
          <div className="h-4 flex-1 shimmer rounded" />
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-4 w-16 shimmer rounded" />
          <div className="h-4 w-20 shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 shimmer rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}
