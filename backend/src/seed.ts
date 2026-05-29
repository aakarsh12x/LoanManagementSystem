import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';

interface SeedUser {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

const seedUsers: SeedUser[] = [
  { fullName: 'Admin User', email: 'admin@lms.com', password: 'Admin@123', role: 'admin' },
  { fullName: 'Sales Executive', email: 'sales@lms.com', password: 'Sales@123', role: 'sales' },
  { fullName: 'Sanction Officer', email: 'sanction@lms.com', password: 'Sanction@123', role: 'sanction' },
  { fullName: 'Disbursement Officer', email: 'disbursement@lms.com', password: 'Disburse@123', role: 'disbursement' },
  { fullName: 'Collection Officer', email: 'collection@lms.com', password: 'Collect@123', role: 'collection' },
  {
    fullName: 'Demo Borrower',
    email: 'borrower@lms.com',
    password: 'Borrower@123',
    role: 'borrower',
  },
];

async function seed() {
  await connectDB();
  console.log('Starting seed...');

  for (const u of seedUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`[SKIP] ${u.email} already exists`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
    console.log(`[CREATE] ${u.role} → ${u.email}`);
  }

  console.log('\nSeed complete! Demo credentials:');
  console.log('----------------------------------------');
  seedUsers.forEach((u) => {
    console.log(`${u.role.padEnd(14)} | ${u.email.padEnd(25)} | ${u.password}`);
  });
  console.log('----------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
