'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  completed,
  total,
  showLabel = true,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {completed.toLocaleString()} / {total.toLocaleString()} completed
          </span>
          <span className="font-bold text-slate-700">{percentage}%</span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn('bg-slate-100', heightMap[size])}
      />
    </div>
  );
}
