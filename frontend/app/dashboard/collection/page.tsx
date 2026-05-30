'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '../../../lib/api';
import { LoanApplication, Payment, User } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

import { BorderBeam } from '../../../components/ui/magic/border-beam';

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
  onSuccess: (amountPaid: number, outstandingAfter: number) => void;
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
      onSuccess(amt, Math.max(0, outstanding - amt));
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
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
        <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight">Record Payment</h2>
        <p className="text-sm text-neutral-400 mb-5">
          Outstanding: <strong className="text-emerald-400 font-bold">{formatCurrency(outstanding)}</strong>
        </p>
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            max={outstanding}
            step={0.01}
            required
            className="w-full"
          />
          <Input
            label="UTR Number"
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Unique transaction reference"
            required
            className="w-full"
          />
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
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
              Record Payment
            </Button>
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
  const [successGuidance, setSuccessGuidance] = useState<{
    title: string;
    description: string;
    actionText: string;
    actionPath: string;
  } | null>(null);

  const loadData = () => {
    setLoading(true);
    dashboardApi.getCollection()
      .then(({ loans }) => setLoans(loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSuccess = (amountPaid: number, outstandingAfter: number) => {
    loadData();
    if (outstandingAfter <= 0.01) {
      setSuccessGuidance({
        title: "Loan Fully Paid!",
        description: `Successfully recorded final payment of ${formatCurrency(amountPaid)}. The loan is now 100% paid and marked as CLOSED.`,
        actionText: "Back to Leads Queue",
        actionPath: "/dashboard/sales",
      });
    } else {
      setSuccessGuidance({
        title: "Payment Recorded!",
        description: `Successfully recorded payment of ${formatCurrency(amountPaid)}. The remaining outstanding balance is ${formatCurrency(outstandingAfter)}.`,
        actionText: "Keep Tracking Collections",
        actionPath: "/dashboard/collection",
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!['admin', 'collection'].includes(user.role)) {
      router.replace('/dashboard/sales');
      return;
    }
    loadData();
  }, [user, router]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Collection Module</h1>
        <p className="text-sm text-neutral-400 mt-1">Track repayments for disbursed loans</p>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-4">{error}</div>}

      {loans.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-12 text-center">
          <p className="text-neutral-400 text-sm">No disbursed loans yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loans.map((loan) => {
            const b = loan.borrowerId as User;
            const outstanding = Math.max(0, loan.totalRepayment - loan.totalPaid);
            const progress = (loan.totalPaid / loan.totalRepayment) * 100;
            const isExpanded = expandedLoan === loan._id;

            return (
              <div key={loan._id} className="bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-white">{b.fullName}</h2>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="text-sm text-neutral-400">{b.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">Disbursed</p>
                      <p className="text-sm font-medium" suppressHydrationWarning>{loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString('en-IN') : '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Loan Amount</p>
                      <p className="font-semibold">{formatCurrency(loan.loanAmount)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Total Repayment</p>
                      <p className="font-semibold">{formatCurrency(loan.totalRepayment)}</p>
                    </div>
                    <div className="bg-emerald-500/10 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Total Paid</p>
                      <p className="font-semibold text-emerald-400">{formatCurrency(loan.totalPaid)}</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Outstanding</p>
                      <p className="font-semibold text-amber-400">{formatCurrency(outstanding)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Repayment Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
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
                  <div className="border-t border-white/10 px-6 pb-4">
                    <table className="w-full text-sm mt-3">
                      <thead className="text-neutral-500 text-xs uppercase">
                        <tr>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">UTR</th>
                          <th className="text-left py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loan.payments.map((p) => (
                          <tr key={p._id}>
                            <td className="py-2 text-neutral-400" suppressHydrationWarning>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2 font-mono text-neutral-300">{p.utr}</td>
                            <td className="py-2 font-medium text-emerald-400">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isExpanded && loan.payments.length === 0 && (
                  <div className="border-t border-white/10 px-6 py-4 text-sm text-gray-400 text-center">
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

