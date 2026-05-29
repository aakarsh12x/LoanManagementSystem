'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'borrower') {
      router.replace('/apply');
    } else {
      // Route ops users to their module
      const roleRoutes: Record<string, string> = {
        admin: '/dashboard/sales',
        sales: '/dashboard/sales',
        sanction: '/dashboard/sanction',
        disbursement: '/dashboard/disbursement',
        collection: '/dashboard/collection',
      };
      router.replace(roleRoutes[user.role] || '/dashboard/sales');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
