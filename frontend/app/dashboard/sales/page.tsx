'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { BorderBeam } from '../../../components/ui/magic/border-beam';

function AddBorrowerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required');
      return;
    }

    setLoading(true);
    try {
      await dashboardApi.createBorrower({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
      });
      onSuccess(email.trim());
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to create borrower.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
        <BorderBeam
          size={250}
          duration={8}
          colorFrom="#10b981"
          colorTo="#0ea5e9"
        />

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Add New Borrower</h2>
          <p className="text-sm text-neutral-400 mt-1">Register a new borrower lead in the system.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            className="w-full"
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            className="w-full"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Optional (defaults to Borrower@123)"
            className="w-full"
          />

          <div className="flex gap-3 mt-4 border-t border-white/5 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-neutral-400 hover:text-white border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
            >
              Create Borrower
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successGuidance, setSuccessGuidance] = useState<{
    title: string;
    description: string;
    actionText: string;
    actionPath: string;
  } | null>(null);

  const loadData = () => {
    setLoading(true);
    dashboardApi.getSales()
      .then(({ users }) => setUsers(users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSuccess = (email: string) => {
    loadData();
    setSuccessGuidance({
      title: "Borrower Registered!",
      description: `The borrower has been added. They can now log in using email "${email}" and password "Borrower@123" to submit their loan application.`,
      actionText: "Go to Sanction Queue",
      actionPath: "/dashboard/sanction",
    });
  };

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'sales'].includes(user.role)) {
      router.replace('/dashboard/sanction');
      return;
    }
    loadData();
  }, [user, router]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Module</h1>
          <p className="text-sm text-neutral-400 mt-1">Registered borrowers who have not yet applied for a loan</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Add Borrower
        </Button>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-4">{error}</div>}

      {users.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-12 text-center">
          <p className="text-neutral-400 text-sm">No pending leads at the moment.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Total Leads</span>
            <span className="text-sm font-bold text-emerald-400">{users.length}</span>
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
                       <td className="px-6 py-4 text-neutral-400">{uid ? 'Registered' : '—'}</td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddBorrowerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Success Guidance Modal */}
      {successGuidance && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <BorderBeam
              size={250}
              duration={8}
              colorFrom="#10b981"
              colorTo="#06b6d4"
            />
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{successGuidance.title}</h2>
              <p className="text-sm text-neutral-400 mt-2">
                {successGuidance.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-6 border-t border-white/5 pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  router.push(successGuidance.actionPath);
                  setSuccessGuidance(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {successGuidance.actionText}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSuccessGuidance(null)}
                className="w-full"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
