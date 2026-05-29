export type UserRole = 'borrower' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'admin';
export type EmploymentMode = 'Salaried' | 'Self-Employed' | 'Unemployed';
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

export interface LoanCalculation {
  simpleInterest: number;
  totalRepayment: number;
}
