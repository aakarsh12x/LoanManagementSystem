'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { DashboardNav } from '../../components/DashboardNav';
import { UserRole } from '../../types';

const OPS_ROLES: UserRole[] = ['admin', 'sales', 'sanction', 'disbursement', 'collection'];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!OPS_ROLES.includes(user.role)) { router.replace('/apply'); }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
