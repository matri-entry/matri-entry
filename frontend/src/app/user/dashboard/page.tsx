'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/shared/StatCard';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';
import CountdownTimer from '@/components/layout/CountdownTimer';
import { ClipboardList, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DashboardData {
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  expiryAt?: string;
}

export default function UserDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      const res = await userApi.getDashboard();
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const completionPercentage = data?.assignedCount
    ? Math.round((data.completedCount / data.assignedCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s your progress overview</p>
        </div>
        <Link href="/user/entry">
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl gap-2 shadow-lg shadow-indigo-500/20">
            Continue Data Entry
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Assigned Records"
              value={data?.assignedCount ?? 0}
              icon={<ClipboardList className="w-6 h-6" />}
              color="indigo"
              subtitle="Total records to complete"
            />
            <StatCard
              title="Completed"
              value={data?.completedCount ?? 0}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="emerald"
              subtitle="Successfully submitted"
            />
            <StatCard
              title="Pending"
              value={data?.pendingCount ?? 0}
              icon={<Clock className="w-6 h-6" />}
              color="amber"
              subtitle="Still remaining"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Card */}
        <Card className="rounded-xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">Completion Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 shimmer rounded" />
                <div className="h-6 shimmer rounded-full" />
                <div className="h-3 w-24 shimmer rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-slate-800 tabular-nums">
                    {completionPercentage}%
                  </p>
                  <p className="text-sm text-slate-500 mb-1">
                    {data?.completedCount?.toLocaleString()} / {data?.assignedCount?.toLocaleString()} records
                  </p>
                </div>
                <Progress
                  value={completionPercentage}
                  className="h-3 bg-slate-100"
                />
                <p className="text-xs text-slate-400">
                  {data?.pendingCount} records remaining to complete your assignment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Countdown Timer Card */}
        <Card className="rounded-xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">Account Validity</CardTitle>
          </CardHeader>
          <CardContent>
            <CountdownTimer expiryAt={user?.expiryAt || data?.expiryAt} variant="full" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Card className="rounded-xl border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Ready to enter more data?</h3>
              <p className="text-sm text-slate-500">
                You have <strong className="text-amber-600">{data?.pendingCount?.toLocaleString() || 0}</strong> records remaining
              </p>
            </div>
            <Link href="/user/entry">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl gap-2 shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                Start Entry
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
