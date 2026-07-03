'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
  trend?: number; // percentage change
  subtitle?: string;
}

const colorMap = {
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600',
    gradient: 'from-indigo-500/10 to-indigo-600/5',
    badge: 'bg-indigo-50 text-indigo-600',
    border: 'border-indigo-100',
    glow: 'shadow-indigo-100',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    badge: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
    glow: 'shadow-emerald-100',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600',
    gradient: 'from-rose-500/10 to-rose-600/5',
    badge: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
    glow: 'shadow-rose-100',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    gradient: 'from-amber-500/10 to-amber-600/5',
    badge: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
    glow: 'shadow-amber-100',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    gradient: 'from-blue-500/10 to-blue-600/5',
    badge: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
    glow: 'shadow-blue-100',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600',
    gradient: 'from-purple-500/10 to-purple-600/5',
    badge: 'bg-purple-50 text-purple-600',
    border: 'border-purple-100',
    glow: 'shadow-purple-100',
  },
};

export default function StatCard({ title, value, icon, color, trend, subtitle }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-xl border bg-white shadow-sm hover-lift cursor-default',
        `border-${color}-100`
      )}
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', colors.gradient)} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.icon)}>
            {icon}
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400'
              )}
            >
              {Math.abs(trend)}% from last week
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
