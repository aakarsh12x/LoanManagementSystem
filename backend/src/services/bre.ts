import { BREResult, EmploymentMode } from '../types';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(params: {
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}): BREResult {
  const errors: string[] = [];

  // Rule 1: PAN format
  if (!PAN_REGEX.test(params.pan.toUpperCase())) {
    errors.push('PAN must match format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)');
  }

  // Rule 2: Age 23–50
  const age = calculateAge(new Date(params.dob));
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50. Your age: ${age}`);
  }

  // Rule 3: Monthly salary >= 25,000
  if (params.monthlySalary < 25000) {
    errors.push('Monthly salary must be at least ₹25,000');
  }

  // Rule 4: Employment mode
  if (params.employmentMode === 'Unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan');
  }

  return { passed: errors.length === 0, errors };
}
