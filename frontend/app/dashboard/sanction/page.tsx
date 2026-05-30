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

export default function SanctionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [successGuidance, setSuccessGuidance] = useState<{
    title: string;
    description: string;
    actionText: string;
    actionPath: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'sanction'].includes(user.role)) {
      router.replace('/dashboard/sales');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = () => {
    setLoading(true);
    dashboardApi.getSanction()
      .then(({ loans }) => setLoans(loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await dashboardApi.sanctionAction(id, { action: 'approve' });
      loadData();
      setSuccessGuidance({
        title: "Application Approved!",
        description: "The loan application has been approved and moved to the Disbursement Phase. You can now disburse the funds.",
        actionText: "Go to Disbursement",
        actionPath: "/dashboard/disbursement",
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { setRejectError('Rejection reason is required'); return; }
    setActionLoading(rejectModal.id);
    try {
      await dashboardApi.sanctionAction(rejectModal.id, { action: 'reject', rejectionReason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      loadData();
      setSuccessGuidance({
        title: "Application Rejected",
        description: "The loan application has been marked as rejected.",
        actionText: "Back to Leads",
        actionPath: "/dashboard/sales",
      });
    } catch (e: unknown) {
      setRejectError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sanction Module</h1>
        <p className="text-sm text-neutral-400 mt-1">Review and approve or reject loan applications</p>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-12 text-center">
          <p className="text-neutral-400 text-sm">No applications pending sanction.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Pending Applications</span>
            <span className="text-sm font-bold text-blue-400">{loans.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Tenure</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Applied</th>
                  <th className="px-6 py-3 text-left">Actions</th>
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
                        <div className="text-xs text-neutral-400">{b.employmentMode} • {b.pan}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-6 py-4">{loan.tenureDays} days</td>
                      <td className="px-6 py-4">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-6 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-6 py-4 text-neutral-400" suppressHydrationWarning>{new Date(loan.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(loan._id)}
                            isLoading={actionLoading === loan._id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => { setRejectModal({ id: loan._id }); setRejectReason(''); setRejectError(''); }}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
            <BorderBeam
              size={250}
              duration={8}
              colorFrom="#ef4444"
              colorTo="#f97316"
            />
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Reject Application</h2>
              <p className="text-sm text-neutral-400 mt-1">Please provide a reason for rejection.</p>
            </div>
            {rejectError && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {rejectError}
              </div>
            )}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all font-sans resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <Button variant="ghost" onClick={() => setRejectModal(null)} className="flex-1">Cancel</Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={actionLoading === rejectModal.id}
                className="flex-1"
              >
                Reject
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

