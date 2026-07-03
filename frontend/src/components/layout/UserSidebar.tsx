'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  Heart,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import CountdownTimer from './CountdownTimer';
import { toast } from 'sonner';

const navItems = [
  {
    href: '/user/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/user/entry',
    label: 'Data Entry',
    icon: ClipboardList,
  },
  {
    href: '/user/records',
    label: 'My Records',
    icon: FileText,
  },
  {
    href: '/user/profile',
    label: 'Profile',
    icon: User,
  },
];

interface UserSidebarProps {
  onClose?: () => void;
}

export default function UserSidebar({ onClose }: UserSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <aside className="w-64 h-full bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/user/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">MatriEntry</h1>
            <p className="text-slate-400 text-xs">Data Entry Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white'
                )}
              />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />
              )}
            </Link>
          );
        })}

        {/* Countdown Timer */}
        <div className="mt-6 px-1">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 px-2">
            Account Timer
          </p>
          <CountdownTimer expiryAt={user?.expiryAt} variant="sidebar" />
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
              {getInitials(user?.name || 'User')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-slate-400 text-xs truncate">@{user?.username}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-2 h-9"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
