'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import UserSidebar from '@/components/layout/UserSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/user/dashboard': 'Dashboard',
  '/user/entry': 'Data Entry',
  '/user/records': 'My Records',
  '/user/profile': 'My Profile',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const pageTitle = pageTitles[pathname] || 'Portal';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <UserSidebar />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <UserSidebar onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 shadow-sm">
          {/* Mobile hamburger — directly controls sheetOpen state (Base UI Sheet doesn't support asChild) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{pageTitle}</h2>
            <p className="text-xs text-slate-400 hidden sm:block">MatriEntry User Portal</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                  {getInitials(user?.name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
                <p className="text-xs text-slate-400">Data Operator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
