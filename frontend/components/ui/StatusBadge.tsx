'use client';

import { LoanStatus } from '../../types';

const statusConfig: Record<LoanStatus, { label: string; classes: string }> = {
  APPLIED:     { label: 'Applied',     classes: 'bg-sky-50 text-sky-700 border border-sky-200/60' },
  SANCTIONED:  { label: 'Sanctioned',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' },
  REJECTED:    { label: 'Rejected',    classes: 'bg-rose-50 text-rose-700 border border-rose-200/60' },
  DISBURSED:   { label: 'Disbursed',   classes: 'bg-blue-50 text-blue-700 border border-blue-200/60' },
  CLOSED:      { label: 'Closed',      classes: 'bg-gray-50 text-gray-600 border border-gray-200/60' },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const config = statusConfig[status] || { label: status, classes: 'bg-gray-50 text-gray-600 border border-gray-200/60' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}
