import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  loanId: Types.ObjectId;
  amount: number;
  utr: string;
  paymentDate: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    amount: { type: Number, required: true, min: 1 },
    utr: { type: String, required: true, unique: true, trim: true },
    paymentDate: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
