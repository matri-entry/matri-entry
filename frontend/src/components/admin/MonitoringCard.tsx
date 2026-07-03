'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCountdown } from '@/hooks/useCountdown';
import { User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonitoringUser {
  id: string;
  name: string;
  username: string;
  assignedCount: number;
  completedCount: number;
  expiryAt?: string;
  isActive: boolean;
  isExpired: boolean;
  lastActivity?: string;
}

interface MonitoringCardProps {
  user: MonitoringUser;
}

export default function MonitoringCard({ user }: MonitoringCardProps) {
  const { days, hours, minutes, colorClass, isExpired: timerExpired } = useCountdown(user.expiryAt);
  const percentage = user.assignedCount > 0
    ? Math.round((user.completedCount / user.assignedCount) * 100)
    : 0;

  const isExpired = user.isExpired || timerExpired;

  return (
    <Card className="rounded-xl border-slate-100 shadow-sm hover-lift overflow-hidden">
      {/* Top accent */}
      <div className={cn(
        'h-1',
        isExpired ? 'bg-rose-400' : !user.isActive ? 'bg-slate-300' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isExpired ? 'bg-rose-100' : !user.isActive ? 'bg-slate-100' : 'bg-indigo-100'
            )}>
              <User className={cn(
                'w-5 h-5',
                isExpired ? 'text-rose-500' : !user.isActive ? 'text-slate-400' : 'text-indigo-600'
              )} />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
              <p className="text-slate-400 text-xs font-mono">@{user.username}</p>
            </div>
          </div>
          <Badge
            className={cn(
              'text-xs border-0',
              isExpired
                ? 'bg-rose-100 text-rose-700'
                : !user.isActive
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {isExpired ? 'Expired' : !user.isActive ? 'Inactive' : 'Active'}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600">
                {user.completedCount} / {user.assignedCount} completed
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">{percentage}%</span>
          </div>
          <Progress
            value={percentage}
            className="h-2 bg-slate-100"
          />
        </div>

        {/* Countdown */}
        <div className={cn('rounded-lg p-3 flex items-center gap-2', 
          isExpired ? 'bg-rose-50' : 'bg-slate-50'
        )}>
          <Clock className={cn('w-3.5 h-3.5 flex-shrink-0', colorClass.replace(' animate-pulse', ''))} />
          <span className={cn('text-xs font-semibold', colorClass)}>
            {isExpired
              ? 'Expired'
              : `${days}d ${hours}h ${minutes}m remaining`}
          </span>
        </div>
      </div>
    </Card>
  );
}
