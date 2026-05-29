'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '../types';
import Link from 'next/link';

const roleModules: Record<string, { path: string; label: string }[]> = {
  admin: [
    { path: '/dashboard/sales', label: 'Sales' },
    { path: '/dashboard/sanction', label: 'Sanction' },
    { path: '/dashboard/disbursement', label: 'Disbursement' },
    { path: '/dashboard/collection', label: 'Collection' },
  ],
  sales: [{ path: '/dashboard/sales', label: 'Sales' }],
  sanction: [{ path: '/dashboard/sanction', label: 'Sanction' }],
  disbursement: [{ path: '/dashboard/disbursement', label: 'Disbursement' }],
  collection: [{ path: '/dashboard/collection', label: 'Collection' }],
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
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900 text-lg">LMS Dashboard</span>
        <div className="flex items-center gap-2">
          {modules.map((m) => (
            <Link
              key={m.path}
              href={m.path}
              className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {user.fullName} · <span className="capitalize font-medium text-blue-600">{user.role}</span>
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
