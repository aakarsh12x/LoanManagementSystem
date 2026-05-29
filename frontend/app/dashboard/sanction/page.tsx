'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { LoanApplication, User } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';

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
    } catch (e: unknown) {
      alert((e as Error).message);
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
        <h1 className="text-2xl font-bold text-gray-900">Sanction Module</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve or reject loan applications</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No applications pending sanction.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Pending Applications</span>
            <span className="text-sm font-bold text-blue-600">{loans.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
              <tbody className="divide-y divide-gray-100">
                {loans.map((loan) => {
                  const b = loan.borrowerId as User;
                  return (
                    <tr key={loan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{b.fullName}</div>
                        <div className="text-xs text-gray-500">{b.email}</div>
                        <div className="text-xs text-gray-400">{b.employmentMode} · {b.pan}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-6 py-4">{loan.tenureDays} days</td>
                      <td className="px-6 py-4">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-6 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-6 py-4 text-gray-500">{new Date(loan.createdAt).toLocaleDateString('en-IN')}</td>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection.</p>
            {rejectError && <div className="mb-3 text-sm text-red-600">{rejectError}</div>}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
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
    </div>
  );
}
