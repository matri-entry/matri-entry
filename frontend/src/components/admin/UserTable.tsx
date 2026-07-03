'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  Clock,
  Power,
  Eye,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface UserRow {
  id: string;
  name: string;
  username: string;
  mobile?: string;
  email?: string;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  firstLogin?: string;
  expiryAt?: string;
  isActive: boolean;
  isExpired: boolean;
}

interface UserTableProps {
  users: UserRow[];
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
  onExtendExpiry: (user: UserRow) => void;
  onToggleActive: (user: UserRow) => void;
}

function StatusBadge({ user }: { user: UserRow }) {
  if (!user.isActive) {
    return (
      <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">Inactive</Badge>
    );
  }
  if (user.isExpired) {
    return (
      <Badge className="bg-rose-100 text-rose-700 border-0 text-xs">Expired</Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
  );
}

export default function UserTable({
  users,
  onEdit,
  onDelete,
  onResetPassword,
  onExtendExpiry,
  onToggleActive,
}: UserTableProps) {
  if (!users.length) {
    return (
      <div className="text-center py-16">
        <Eye className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No users found</p>
        <p className="text-slate-300 text-sm mt-1">Create a new user to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Username</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Mobile</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-center">Assigned</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-center hidden lg:table-cell">Done</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-center hidden lg:table-cell">Pending</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">First Login</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">Expiry</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-medium text-slate-800 text-sm">{user.name}</TableCell>
              <TableCell className="text-slate-500 text-sm font-mono">@{user.username}</TableCell>
              <TableCell className="text-slate-500 text-sm hidden md:table-cell">{user.mobile || '—'}</TableCell>
              <TableCell className="text-center text-sm font-semibold text-slate-700">{user.assignedCount}</TableCell>
              <TableCell className="text-center text-sm text-emerald-600 font-medium hidden lg:table-cell">{user.completedCount}</TableCell>
              <TableCell className="text-center text-sm text-amber-600 font-medium hidden lg:table-cell">{user.pendingCount}</TableCell>
              <TableCell className="text-slate-400 text-xs hidden xl:table-cell">
                {user.firstLogin ? formatDate(user.firstLogin) : 'Never'}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <span className={`text-xs font-medium ${user.isExpired ? 'text-rose-500' : 'text-slate-500'}`}>
                  {user.expiryAt ? formatDate(user.expiryAt) : '—'}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge user={user} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                <DropdownMenuTrigger
                    render={(
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" />
                    )}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem onClick={() => onEdit(user)} className="gap-2 cursor-pointer">
                      <Pencil className="w-3.5 h-3.5 text-amber-500" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user)} className="gap-2 cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExtendExpiry(user)} className="gap-2 cursor-pointer">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Extend Expiry
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(user)} className="gap-2 cursor-pointer">
                      <Power className={`w-3.5 h-3.5 ${user.isActive ? 'text-slate-500' : 'text-emerald-500'}`} />
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
