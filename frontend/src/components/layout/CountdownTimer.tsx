'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiryAt?: string;
  variant?: 'full' | 'compact' | 'sidebar';
}

export default function CountdownTimer({ expiryAt, variant = 'full' }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, colorClass, bgClass } = useCountdown(expiryAt);

  if (!expiryAt) {
    return (
      <div className="text-slate-400 text-sm">No expiry set</div>
    );
  }

  if (isExpired) {
    return (
      <div className={cn('flex items-center gap-2 text-rose-500', variant === 'sidebar' && 'text-xs')}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold animate-pulse">Account Expired</span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('rounded-lg p-3', bgClass.replace('bg-', 'bg-').replace('/10', '/20'))}>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className={cn('w-3.5 h-3.5', colorClass.replace('animate-pulse', ''))} />
          <span className={cn('text-xs font-semibold', colorClass.replace('animate-pulse', ''))}>
            Time Remaining
          </span>
        </div>
        <div className={cn('text-sm font-bold', colorClass)}>
          {isExpired ? (
            'Expired'
          ) : (
            `${days}d ${hours}h ${minutes}m ${seconds}s`
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', colorClass)}>
        <Clock className="w-4 h-4" />
        <span className="font-semibold text-sm">
          {days}d {hours}h {minutes}m {seconds}s remaining
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('rounded-xl p-4', bgClass)}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className={cn('w-4 h-4', colorClass.replace(' animate-pulse', ''))} />
        <span className={cn('text-sm font-semibold', colorClass.replace(' animate-pulse', ''))}>
          Time Remaining
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: days, label: 'Days' },
          { value: hours, label: 'Hours' },
          { value: minutes, label: 'Mins' },
          { value: seconds, label: 'Secs' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className={cn('text-2xl font-bold tabular-nums', colorClass)}>
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <p className={cn('text-center text-xs mt-3 font-medium', colorClass.replace(' animate-pulse', ''))}>
        {days > 7
          ? 'Account is active'
          : days >= 3
          ? 'Expiring soon — please contact admin'
          : 'Critical: Expires very soon!'}
      </p>
    </div>
  );
}
