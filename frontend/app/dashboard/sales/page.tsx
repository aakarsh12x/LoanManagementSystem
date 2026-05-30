'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { User } from '../../../types';

export default function SalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'sales'].includes(user.role)) {
      router.replace('/dashboard/sanction');
      return;
    }
    dashboardApi.getSales()
      .then(({ users }) => setUsers(users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sales Module</h1>
        <p className="text-sm text-neutral-400 mt-1">Registered borrowers who have not yet applied for a loan</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>}

      {users.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-12 text-center">
          <p className="text-gray-500 text-sm">No pending leads at the moment.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Total Leads</span>
            <span className="text-sm font-bold text-blue-600">{users.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                   const uid = (u as unknown as { _id?: string })._id || u.id;
                   return (
                     <tr key={uid} className="hover:bg-white/5">
                       <td className="px-6 py-4 font-medium text-white">{u.fullName}</td>
                       <td className="px-6 py-4 text-neutral-400">{u.email}</td>
                       <td className="px-6 py-4 text-neutral-400">{uid ? 'Registered' : 'â€”'}</td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

