export type UserRole = 'borrower' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'admin';
export type EmploymentMode = 'Salaried' | 'Self-Employed' | 'Unemployed';
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
}

export interface LoanApplication {
  _id: string;
  borrowerId: User | string;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  salarySlipPath?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  totalPaid: number;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  amount: number;
  utr: string;
  paymentDate: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
