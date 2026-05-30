const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['borrower', 'sales', 'sanction', 'disbursement', 'collection', 'admin'], default: 'borrower' },
  pan: String,
  dob: String,
  monthlySalary: Number,
  employmentMode: String,
}, { timestamps: true });

const LoanApplicationSchema = new Schema({
  borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  loanAmount: { type: Number, required: true },
  tenureDays: { type: Number, required: true },
  interestRate: { type: Number, required: true, default: 12 },
  simpleInterest: { type: Number, required: true },
  totalRepayment: { type: Number, required: true },
  status: {
    type: String,
    enum: ['APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'],
    default: 'APPLIED',
  },
  rejectionReason: String,
  salarySlipPath: String,
  sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  sanctionedAt: Date,
  disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  disbursedAt: Date,
  totalPaid: { type: Number, default: 0 },
}, { timestamps: true });

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/loandb');
    console.log('Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const LoanApplication = mongoose.models.LoanApplication || mongoose.model('LoanApplication', LoanApplicationSchema);

    // Get admin user for sanctionedBy reference
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found!');
      process.exit(1);
    }

    // Find or create borrower
    let borrower = await User.findOne({ email: 'test_disburse@example.com' });
    if (!borrower) {
      borrower = await User.create({
        fullName: 'Test Disburse User',
        email: 'test_disburse@example.com',
        password: 'hashed_dummy_password',
        role: 'borrower',
        pan: 'ABCDE1234F',
        dob: '1990-01-01',
        monthlySalary: 80000,
        employmentMode: 'Salaried'
      });
      console.log('Created borrower:', borrower._id);
    } else {
      console.log('Found existing borrower:', borrower._id);
    }

    // Create loan
    const loan = await LoanApplication.create({
      borrowerId: borrower._id,
      loanAmount: 150000,
      tenureDays: 180,
      interestRate: 12,
      simpleInterest: 8876.71,
      totalRepayment: 158876.71,
      status: 'SANCTIONED',
      sanctionedBy: admin._id,
      sanctionedAt: new Date(),
      totalPaid: 0
    });

    console.log('Created sanctioned loan:', loan._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
