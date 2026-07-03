'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import UserTable, { UserRow } from '@/components/admin/UserTable';
import CreateUserModal from '@/components/admin/CreateUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { SkeletonTable } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRow | null>(null);
  const [extendUser, setExtendUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [extendDays, setExtendDays] = useState(30);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const res = await adminApi.getUsers({ search });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data.data.map((u: any) => ({
        id: u._id,
        name: u.fullName,
        username: u.username,
        mobile: u.mobileNumber,
        email: u.email,
        assignedCount: u.assignedCount,
        completedCount: u.completedCount,
        pendingCount: u.pendingCount,
        firstLogin: u.firstLoginAt,
        expiryAt: u.expiryAt,
        isActive: u.isActive,
        isExpired: u.expiryAt ? new Date(u.expiryAt) < new Date() : false,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminApi.resetPassword(id, password),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setResetPasswordUser(null);
      setNewPassword('');
    },
    onError: () => toast.error('Failed to reset password'),
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      adminApi.extendExpiry(id, days),
    onSuccess: () => {
      toast.success(`Expiry extended by ${extendDays} days`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setExtendUser(null);
    },
    onError: () => toast.error('Failed to extend expiry'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleActive(id),
    onSuccess: (_, id) => {
      const user = users.find((u) => u.id === id);
      toast.success(`User ${user?.isActive ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to toggle user status'),
  });

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm">Manage data entry operators</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {/* Search */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, username, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-slate-200 focus:border-indigo-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={6} />
            </div>
          ) : (
            <UserTable
              users={users}
              onEdit={setEditUser}
              onDelete={setDeleteUser}
              onResetPassword={setResetPasswordUser}
              onExtendExpiry={setExtendUser}
              onToggleActive={(user) => toggleActiveMutation.mutate(user.id)}
            />
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refreshUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onSuccess={refreshUsers}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This will also delete all their submitted entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={() => { setResetPasswordUser(null); setNewPassword(''); }}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset Password — {resetPasswordUser?.name}</DialogTitle>
            <DialogDescription>Enter a new password for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="h-9"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => resetPasswordUser && resetPasswordMutation.mutate({ id: resetPasswordUser.id, password: newPassword })}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Expiry Dialog */}
      <Dialog open={!!extendUser} onOpenChange={() => setExtendUser(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Extend Expiry — {extendUser?.name}</DialogTitle>
            <DialogDescription>Enter the number of additional days to extend the account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Additional Days</Label>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              min={1}
              max={365}
              className="h-9"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendUser(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => extendUser && extendMutation.mutate({ id: extendUser.id, days: extendDays })}
              disabled={extendDays < 1 || extendMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {extendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Extend Expiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
