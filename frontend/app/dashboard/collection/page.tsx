'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { LoanApplication, Payment, User } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

type LoanWithPayments = LoanApplication & { payments: Payment[] };

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

function PaymentModal({
  loan,
  onClose,
  onSuccess,
}: {
  loan: LoanWithPayments;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const outstanding = Math.max(0, loan.totalRepayment - loan.totalPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (amt > outstanding + 0.01) { setError(`Cannot exceed outstanding balance of ${formatCurrency(outstanding)}`); return; }
    if (!utr.trim()) { setError('UTR is required'); return; }
    setLoading(true);
    try {
      await dashboardApi.recordPayment(loan._id, { amount: amt, utr: utr.trim(), paymentDate });
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Record Payment</h2>
        <p className="text-sm text-gray-500 mb-4">
          Outstanding: <strong>{formatCurrency(outstanding)}</strong>
        </p>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            max={outstanding}
            step={0.01}
            required
          />
          <Input
            label="UTR Number"
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Unique transaction reference"
            required
          />
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={loading} className="flex-1">Record Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanWithPayments | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'collection'].includes(user.role)) {
      router.replace('/dashboard/sales');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = () => {
    setLoading(true);
    dashboardApi.getCollection()
      .then(({ loans }) => setLoans(loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collection Module</h1>
        <p className="text-sm text-gray-500 mt-1">Track repayments for disbursed loans</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No disbursed loans yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loans.map((loan) => {
            const b = loan.borrowerId as User;
            const outstanding = Math.max(0, loan.totalRepayment - loan.totalPaid);
            const progress = (loan.totalPaid / loan.totalRepayment) * 100;
            const isExpanded = expandedLoan === loan._id;

            return (
              <div key={loan._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">{b.fullName}</h2>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="text-sm text-gray-500">{b.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Disbursed</p>
                      <p className="text-sm font-medium">{loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString('en-IN') : '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Loan Amount</p>
                      <p className="font-semibold">{formatCurrency(loan.loanAmount)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Repayment</p>
                      <p className="font-semibold">{formatCurrency(loan.totalRepayment)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="font-semibold text-green-700">{formatCurrency(loan.totalPaid)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className="font-semibold text-orange-700">{formatCurrency(outstanding)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Repayment Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    {loan.status === 'DISBURSED' && (
                      <Button size="sm" onClick={() => setSelectedLoan(loan)}>
                        Record Payment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedLoan(isExpanded ? null : loan._id)}
                    >
                      {isExpanded ? 'Hide' : 'View'} Payments ({loan.payments.length})
                    </Button>
                  </div>
                </div>

                {/* Payments table */}
                {isExpanded && loan.payments.length > 0 && (
                  <div className="border-t border-gray-100 px-6 pb-4">
                    <table className="w-full text-sm mt-3">
                      <thead className="text-gray-500 text-xs uppercase">
                        <tr>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">UTR</th>
                          <th className="text-left py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loan.payments.map((p) => (
                          <tr key={p._id}>
                            <td className="py-2 text-gray-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2 font-mono text-gray-700">{p.utr}</td>
                            <td className="py-2 font-medium text-green-700">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isExpanded && loan.payments.length === 0 && (
                  <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-400 text-center">
                    No payments recorded yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedLoan && (
        <PaymentModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
