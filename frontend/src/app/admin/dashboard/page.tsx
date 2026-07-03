'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import StatCard from '@/components/shared/StatCard';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';
import { Users, UserCheck, UserX, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  totalEntries: number;
  todayEntries?: number;
  recentActivity?: Array<{
    id: string;
    userName: string;
    action: string;
    timestamp: string;
    count?: number;
  }>;
  topPerformers?: Array<{
    id: string;
    name: string;
    username: string;
    completed: number;
    assigned: number;
    percentage: number;
  }>;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminApi.getDashboardStats();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor system performance and user activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Users"
              value={data?.totalUsers ?? 0}
              icon={<Users className="w-6 h-6" />}
              color="indigo"
              subtitle="All registered operators"
            />
            <StatCard
              title="Active Users"
              value={data?.activeUsers ?? 0}
              icon={<UserCheck className="w-6 h-6" />}
              color="emerald"
              subtitle="Currently active accounts"
            />
            <StatCard
              title="Expired Users"
              value={data?.expiredUsers ?? 0}
              icon={<UserX className="w-6 h-6" />}
              color="rose"
              subtitle="Accounts past expiry"
            />
            <StatCard
              title="Total Entries"
              value={data?.totalEntries ?? 0}
              icon={<FileText className="w-6 h-6" />}
              color="amber"
              subtitle="All submitted records"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="rounded-xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 shimmer rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 w-32 shimmer rounded mb-1" />
                      <div className="h-2 w-full shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.topPerformers?.length ? (
              <div className="space-y-4">
                {data.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-700 truncate">{performer.name}</p>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {performer.completed}/{performer.assigned}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${performer.percentage}%` }}
                        />
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 border-0 text-xs flex-shrink-0"
                    >
                      {performer.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No performance data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-48 shimmer rounded mb-1" />
                      <div className="h-2 w-24 shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentActivity?.length ? (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">{activity.userName}</span>
                        {' '}{activity.action}
                        {activity.count && (
                          <span className="text-indigo-600 font-semibold"> {activity.count} records</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
