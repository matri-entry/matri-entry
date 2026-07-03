'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import MonitoringCard from '@/components/admin/MonitoringCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
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

export default function AdminMonitoringPage() {
  const [users, setUsers] = useState<MonitoringUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMonitoring = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await adminApi.getMonitoring();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = res.data.data.map((u: any) => ({
        id: u.userId,
        name: u.fullName,
        username: u.username,
        assignedCount: u.assignedCount,
        completedCount: u.completedCount,
        expiryAt: u.expiryAt,
        isActive: u.isActive,
        isExpired: u.expiryAt ? new Date(u.expiryAt) < new Date() : false,
      }));
      setUsers(mapped);
      setLastUpdated(new Date());
    } catch {
      // Silently fail on auto-refresh
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(() => fetchMonitoring(true), 10000);
    return () => clearInterval(interval);
  }, [fetchMonitoring]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">Live Monitoring</h1>
            <div className="relative flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-sm">Auto-refreshing every 10 seconds</p>
            {lastUpdated && (
              <span className="text-slate-400 text-xs">
                • Last updated: {formatDateTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => fetchMonitoring(false)}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2 rounded-xl border-slate-200"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          Refresh Now
        </Button>
      </div>

      {/* Summary bar */}
      {!isLoading && users.length > 0 && (
        <div className="flex items-center gap-6 bg-white rounded-xl border border-slate-100 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-emerald-600">
                {users.filter((u) => u.isActive && !u.isExpired).length}
              </span> Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-rose-500">
                {users.filter((u) => u.isExpired).length}
              </span> Expired
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-600">
                {users.filter((u) => !u.isActive).length}
              </span> Inactive
            </span>
          </div>
          <div className="ml-auto text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {users.reduce((sum, u) => sum + u.completedCount, 0).toLocaleString()}
            </span> total entries submitted
          </div>
        </div>
      )}

      {/* User Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading monitoring data..." />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No users to monitor</p>
          <p className="text-slate-300 text-sm">Create users to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <MonitoringCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
