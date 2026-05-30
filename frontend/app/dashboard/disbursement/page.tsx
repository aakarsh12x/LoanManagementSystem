'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { LoanApplication, User } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { BorderBeam } from '../../../components/ui/magic/border-beam';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function DisbursementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmLoan, setConfirmLoan] = useState<LoanApplication | null>(null);
  const [successGuidance, setSuccessGuidance] = useState<{
    title: string;
    description: string;
    actionText: string;
    actionPath: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'disbursement'].includes(user.role)) {
      router.replace('/dashboard/sales');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = () => {
    setLoading(true);
    dashboardApi.getDisbursement()
      .then(({ loans }) => setLoans(loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleDisburse = (loan: LoanApplication) => {
    setConfirmLoan(loan);
  };

  const executeDisburse = async () => {
    if (!confirmLoan) return;
    const id = confirmLoan._id;
    setActionLoading(id);
    try {
      await dashboardApi.disburseLoan(id);
      setConfirmLoan(null);
      loadData();
      setSuccessGuidance({
        title: "Funds Disbursed!",
        description: "The loan has been marked as disbursed and moved to the Collection Module.",
        actionText: "Go to Collection",
        actionPath: "/dashboard/collection",
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Disbursement Module</h1>
        <p className="text-sm text-neutral-400 mt-1">Mark sanctioned loans as disbursed</p>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-12 text-center">
          <p className="text-neutral-400 text-sm">No sanctioned loans awaiting disbursement.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Sanctioned Loans</span>
            <span className="text-sm font-bold text-blue-400">{loans.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Sanctioned</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loans.map((loan) => {
                  const b = loan.borrowerId as User;
                  return (
                    <tr key={loan._id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{b.fullName}</div>
                        <div className="text-xs text-neutral-400">{b.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-6 py-4">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-6 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-6 py-4 text-neutral-400" suppressHydrationWarning>
                        {loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => handleDisburse(loan)}
                          isLoading={actionLoading === loan._id}
                        >
                          Mark Disbursed
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmLoan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
            <BorderBeam
              size={250}
              duration={8}
              colorFrom="#10b981"
              colorTo="#06b6d4"
            />
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Confirm Disbursement</h2>
              <p className="text-sm text-neutral-400 mt-2">
                Are you sure you want to mark the loan of <strong className="text-white">{(confirmLoan.borrowerId as User).fullName}</strong> ({formatCurrency(confirmLoan.loanAmount)}) as disbursed?
              </p>
              <p className="text-xs text-amber-400/80 mt-2">
                This action will move the loan to the collection phase.
              </p>
            </div>
            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <Button
                variant="ghost"
                onClick={() => setConfirmLoan(null)}
                className="flex-1"
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={executeDisburse}
                isLoading={actionLoading === confirmLoan._id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Disburse
              </Button>
            </div>
          </div>
        </div>
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

