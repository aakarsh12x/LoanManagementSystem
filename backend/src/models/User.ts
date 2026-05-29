import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, EmploymentMode } from '../types';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  // Borrower-specific optional fields
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['borrower', 'sales', 'sanction', 'disbursement', 'collection', 'admin'],
      required: true,
    },
    pan: { type: String, uppercase: true, trim: true },
    dob: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
