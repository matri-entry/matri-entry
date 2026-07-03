'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CountdownTimer from '@/components/layout/CountdownTimer';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';

interface ProfileData {
  id: string;
  name: string;
  username: string;
  mobile?: string;
  email?: string;
  assignedCount: number;
  completedCount: number;
  firstLogin?: string;
  expiryAt?: string;
  isActive: boolean;
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-700 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user: authUser } = useAuth();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const [profileRes, progressRes] = await Promise.all([
        userApi.getProfile(),
        userApi.getProgress(),
      ]);
      const u = profileRes.data.data;
      const progress = progressRes.data.data;
      return {
        id: u._id,
        name: u.fullName,
        username: u.username,
        mobile: u.mobileNumber,
        email: u.email,
        assignedCount: u.assignedCount,
        completedCount: progress?.completed ?? 0,
        firstLogin: u.firstLoginAt,
        expiryAt: u.expiryAt,
        isActive: u.isActive,
      };
    },
  });

  const data = profile || authUser;
  const completionPct =
    data?.assignedCount
      ? Math.round(((data as ProfileData).completedCount / data.assignedCount) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm">View your account information and statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + basic info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                    {getInitials(data?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold text-slate-800">{data?.name}</h2>
                <p className="text-slate-500 text-sm font-mono">@{data?.username}</p>
                <div className="mt-3">
                  <Badge
                    className={`text-xs border-0 ${
                      (data as ProfileData)?.isActive !== false
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {(data as ProfileData)?.isActive !== false ? 'Active Account' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <InfoItem icon={Phone} label="Mobile" value={(data as ProfileData)?.mobile} />
                <InfoItem icon={Mail} label="Email" value={(data as ProfileData)?.email} />
                <InfoItem icon={User} label="Role" value="Data Operator" />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Account Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">First Login</p>
                  <p className="text-sm font-medium text-slate-700">
                    {(data as ProfileData)?.firstLogin
                      ? formatDate((data as ProfileData).firstLogin!)
                      : 'Not yet'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Account Expires</p>
                  <p className="text-sm font-medium text-slate-700">
                    {(data as ProfileData)?.expiryAt
                      ? formatDate((data as ProfileData).expiryAt!)
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats + countdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                {[
                  {
                    icon: ClipboardList,
                    label: 'Assigned',
                    value: data?.assignedCount ?? 0,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                  },
                  {
                    icon: CheckCircle2,
                    label: 'Completed',
                    value: (data as ProfileData)?.completedCount ?? 0,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    icon: Clock,
                    label: 'Pending',
                    value: (data?.assignedCount ?? 0) - ((data as ProfileData)?.completedCount ?? 0),
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <Card key={label} className="rounded-xl border-slate-100 shadow-sm text-center">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 tabular-nums">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Completion Progress */}
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Completion Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-slate-800">{completionPct}%</span>
                <span className="text-sm text-slate-500">
                  {(data as ProfileData)?.completedCount?.toLocaleString() || 0} of {data?.assignedCount?.toLocaleString() || 0}
                </span>
              </div>
              <Progress value={completionPct} className="h-2.5 bg-slate-100" />
            </CardContent>
          </Card>

          {/* Countdown */}
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Account Validity Countdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CountdownTimer
                expiryAt={authUser?.expiryAt || (data as ProfileData)?.expiryAt}
                variant="full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
