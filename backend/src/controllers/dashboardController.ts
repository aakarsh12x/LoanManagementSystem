import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { LoanApplication } from '../models/LoanApplication';
import { Payment } from '../models/Payment';

// SALES: users who registered but have not applied yet
export const getSalesData = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find all borrowers
    const borrowers = await User.find({ role: 'borrower' }).select('-password').lean();

    // Find borrowers who have applied
    const applicantIds = await LoanApplication.distinct('borrowerId');

    // Filter out those who applied
    const pending = borrowers.filter(
      (b) => !applicantIds.some((id) => id.toString() === b._id.toString())
    );

    res.json({ users: pending, total: pending.length });
  } catch (err) { next(err); }
};

// SANCTION: loans with status APPLIED
export const getSanctionData = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await LoanApplication.find({ status: 'APPLIED' })
      .populate('borrowerId', 'fullName email pan dob monthlySalary employmentMode')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ loans, total: loans.length });
  } catch (err) { next(err); }
};

// SANCTION ACTION: approve or reject
export const sanctionAction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'action must be approve or reject' });
      return;
    }

    const loan = await LoanApplication.findById(id);
    if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
    if (loan.status !== 'APPLIED') {
      res.status(409).json({ message: `Cannot sanction a loan with status ${loan.status}` });
      return;
    }

    if (action === 'approve') {
      loan.status = 'SANCTIONED';
      loan.sanctionedBy = req.user!.userId as unknown as typeof loan.sanctionedBy;
      loan.sanctionedAt = new Date();
    } else {
      if (!rejectionReason?.trim()) {
        res.status(400).json({ message: 'rejectionReason is required when rejecting' });
        return;
      }
      loan.status = 'REJECTED';
      loan.rejectionReason = rejectionReason.trim();
    }

    await loan.save();
    res.json({ loan });
  } catch (err) { next(err); }
};

// DISBURSEMENT: loans with status SANCTIONED
export const getDisbursementData = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await LoanApplication.find({ status: 'SANCTIONED' })
      .populate('borrowerId', 'fullName email')
      .populate('sanctionedBy', 'fullName')
      .sort({ sanctionedAt: -1 })
      .lean();
    res.json({ loans, total: loans.length });
  } catch (err) { next(err); }
};

// DISBURSEMENT ACTION: mark as disbursed
export const disburseLoan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const loan = await LoanApplication.findById(id);
    if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
    if (loan.status !== 'SANCTIONED') {
      res.status(409).json({ message: `Cannot disburse a loan with status ${loan.status}` });
      return;
    }

    loan.status = 'DISBURSED';
    loan.disbursedBy = req.user!.userId as unknown as typeof loan.disbursedBy;
    loan.disbursedAt = new Date();
    await loan.save();

    res.json({ loan });
  } catch (err) { next(err); }
};

// COLLECTION: loans with status DISBURSED or CLOSED
export const getCollectionData = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await LoanApplication.find({ status: { $in: ['DISBURSED', 'CLOSED'] } })
      .populate('borrowerId', 'fullName email')
      .sort({ disbursedAt: -1 })
      .lean();

    // Attach payments to each loan
    const loansWithPayments = await Promise.all(
      loans.map(async (loan) => {
        const payments = await Payment.find({ loanId: loan._id }).sort({ paymentDate: 1 }).lean();
        return { ...loan, payments };
      })
    );

    res.json({ loans: loansWithPayments, total: loans.length });
  } catch (err) { next(err); }
};

// COLLECTION: record a payment
export const recordPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, utr, paymentDate } = req.body;

    if (!amount || !utr || !paymentDate) {
      res.status(400).json({ message: 'amount, utr, and paymentDate are required' });
      return;
    }

    const loan = await LoanApplication.findById(id);
    if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
    if (loan.status !== 'DISBURSED') {
      res.status(409).json({ message: `Cannot record payment for loan with status ${loan.status}` });
      return;
    }

    // Check UTR uniqueness
    const existingPayment = await Payment.findOne({ utr: utr.trim() });
    if (existingPayment) {
      res.status(409).json({ message: `UTR ${utr} already exists` });
      return;
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be greater than 0' });
      return;
    }

    const outstanding = loan.totalRepayment - loan.totalPaid;
    if (payAmount > outstanding + 0.01) {
      res.status(400).json({ message: `Payment exceeds outstanding balance of ₹${outstanding.toFixed(2)}` });
      return;
    }

    const payment = await Payment.create({
      loanId: loan._id,
      amount: payAmount,
      utr: utr.trim(),
      paymentDate: new Date(paymentDate),
      recordedBy: req.user!.userId,
    });

    // Update totalPaid and potentially close the loan
    loan.totalPaid = Math.round((loan.totalPaid + payAmount) * 100) / 100;
    if (loan.totalPaid >= loan.totalRepayment - 0.01) {
      loan.status = 'CLOSED';
    }
    await loan.save();

    res.status(201).json({ payment, loan: { status: loan.status, totalPaid: loan.totalPaid, totalRepayment: loan.totalRepayment } });
  } catch (err) { next(err); }
};

// COLLECTION: get payments for a specific loan
export const getLoanPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await Payment.find({ loanId: id }).sort({ paymentDate: 1 }).lean();
    res.json({ payments });
  } catch (err) { next(err); }
};
