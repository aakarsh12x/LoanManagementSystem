'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { FloatingDock, DockItem } from './ui/aceternity/floating-dock';
import { UserRole } from '../types';

/* ── Module icons (inline SVG, no extra dep) ── */
function IconSales() {
  return (
    <svg className="h-full w-full text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconSanction() {
  return (
    <svg className="h-full w-full text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconDisburse() {
  return (
    <svg className="h-full w-full text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconCollect() {
  return (
    <svg className="h-full w-full text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}
function IconLogout({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-full w-full items-center justify-center"
      title="Logout"
    >
      <svg className="h-full w-full text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
}

const roleModules: Record<string, DockItem[]> = {
  admin: [
    { title: 'Sales',        icon: <IconSales />,    href: '/dashboard/sales' },
    { title: 'Sanction',     icon: <IconSanction />, href: '/dashboard/sanction' },
    { title: 'Disbursement', icon: <IconDisburse />, href: '/dashboard/disbursement' },
    { title: 'Collection',   icon: <IconCollect />,  href: '/dashboard/collection' },
  ],
  sales:        [{ title: 'Sales',        icon: <IconSales />,    href: '/dashboard/sales' }],
  sanction:     [{ title: 'Sanction',     icon: <IconSanction />, href: '/dashboard/sanction' }],
  disbursement: [{ title: 'Disbursement', icon: <IconDisburse />, href: '/dashboard/disbursement' }],
  collection:   [{ title: 'Collection',   icon: <IconCollect />,  href: '/dashboard/collection' }],
};

export function DashboardNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const modules = roleModules[user.role] || [];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">LMS Dashboard</span>
        </div>

        {/* Floating Dock — module nav */}
        <FloatingDock items={modules} />

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-white leading-none">{user.fullName}</p>
            <p className="text-xs text-emerald-400 capitalize mt-0.5">{user.role}</p>
          </div>
          <div className="h-8 w-8">
            <IconLogout onClick={handleLogout} />
          </div>
        </div>

      </div>
    </header>
  );
}
