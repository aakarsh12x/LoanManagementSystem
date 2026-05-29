import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { LoanApplication } from '../models/LoanApplication';
import { runBRE } from '../services/bre';
import { calculateLoan } from '../services/loanCalculator';
import { EmploymentMode } from '../types';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    const updates: Record<string, unknown> = {};
    if (fullName) updates.fullName = fullName;
    if (pan) updates.pan = pan.toUpperCase();
    if (dob) updates.dob = new Date(dob);
    if (monthlySalary !== undefined) updates.monthlySalary = Number(monthlySalary);
    if (employmentMode) updates.employmentMode = employmentMode;

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user });
  } catch (err) { next(err); }
};

export const uploadSalarySlip = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    res.json({ filePath: req.file.path, fileName: req.file.filename });
  } catch (err) { next(err); }
};

export const applyLoan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Check for existing active application
    const existing = await LoanApplication.findOne({
      borrowerId: userId,
      status: { $nin: ['REJECTED', 'CLOSED'] },
    });
    if (existing) {
      res.status(409).json({ message: 'You already have an active loan application' });
      return;
    }

    // Fetch user profile for BRE
    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    if (!user.pan || !user.dob || user.monthlySalary === undefined || !user.employmentMode) {
      res.status(400).json({ message: 'Please complete your profile before applying' });
      return;
    }

    // Run BRE
    const breResult = runBRE({
      pan: user.pan,
      dob: user.dob,
      monthlySalary: user.monthlySalary,
      employmentMode: user.employmentMode as EmploymentMode,
    });

    if (!breResult.passed) {
      res.status(422).json({ message: 'Eligibility check failed', errors: breResult.errors });
      return;
    }

    const { loanAmount, tenureDays, salarySlipPath } = req.body;

    if (!loanAmount || !tenureDays) {
      res.status(400).json({ message: 'loanAmount and tenureDays are required' });
      return;
    }

    const amount = Number(loanAmount);
    const tenure = Number(tenureDays);

    if (amount < 50000 || amount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
      return;
    }
    if (tenure < 30 || tenure > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });
      return;
    }

    const { simpleInterest, totalRepayment } = calculateLoan(amount, tenure);

    const loan = await LoanApplication.create({
      borrowerId: userId,
      loanAmount: amount,
      tenureDays: tenure,
      interestRate: 12,
      simpleInterest,
      totalRepayment,
      status: 'APPLIED',
      salarySlipPath: salarySlipPath || '',
    });

    res.status(201).json({ loan });
  } catch (err) { next(err); }
};

export const getMyApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loan = await LoanApplication.findOne({ borrowerId: req.user!.userId })
      .sort({ createdAt: -1 })
      .populate('borrowerId', 'fullName email pan dob monthlySalary employmentMode');
    res.json({ loan });
  } catch (err) { next(err); }
};
