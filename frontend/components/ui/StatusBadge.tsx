'use client';

import { LoanStatus } from '../../types';

const statusConfig: Record<LoanStatus, { label: string; classes: string }> = {
  APPLIED:     { label: 'Applied',     classes: 'bg-blue-100 text-blue-800' },
  SANCTIONED:  { label: 'Sanctioned',  classes: 'bg-green-100 text-green-800' },
  REJECTED:    { label: 'Rejected',    classes: 'bg-red-100 text-red-800' },
  DISBURSED:   { label: 'Disbursed',   classes: 'bg-purple-100 text-purple-800' },
  CLOSED:      { label: 'Closed',      classes: 'bg-gray-100 text-gray-700' },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}
