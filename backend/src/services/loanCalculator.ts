import { LoanCalculation } from '../types';

/**
 * Simple Interest: SI = (P × R × T) / (365 × 100)
 * Total Repayment = P + SI
 * R is fixed at 12% p.a.
 */
export function calculateLoan(principal: number, tenureDays: number): LoanCalculation {
  const rate = 12; // fixed p.a.
  const simpleInterest = (principal * rate * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;

  return {
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}
