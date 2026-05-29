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

export default function DisbursementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleDisburse = async (id: string) => {
    if (!confirm('Mark this loan as disbursed?')) return;
    setActionLoading(id);
    try {
      await dashboardApi.disburseLoan(id);
      loadData();
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disbursement Module</h1>
        <p className="text-sm text-gray-500 mt-1">Mark sanctioned loans as disbursed</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No sanctioned loans awaiting disbursement.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sanctioned Loans</span>
            <span className="text-sm font-bold text-blue-600">{loans.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Sanctioned</th>
                  <th className="px-6 py-3 text-left">Action</th>
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
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-6 py-4">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-6 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-6 py-4 text-gray-500">
                        {loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => handleDisburse(loan._id)}
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
    </div>
  );
}
