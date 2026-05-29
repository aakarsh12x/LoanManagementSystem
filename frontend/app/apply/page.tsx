'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { borrowerApi } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoanApplication, EmploymentMode } from '../../types';

type Step = 1 | 2 | 3 | 4;

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

export default function ApplyPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [breErrors, setBreErrors] = useState<string[]>([]);

  // Existing application
  const [existingApp, setExistingApp] = useState<LoanApplication | null>(null);

  // Step 2: Personal details
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode | ''>('');

  // Step 3: Salary slip
  const [salarySlipFile, setSalarySlipFile] = useState<File | null>(null);
  const [salarySlipPath, setSalarySlipPath] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Loan config
  const [loanAmount, setLoanAmount] = useState('100000');
  const [tenureDays, setTenureDays] = useState('180');
  const [preview, setPreview] = useState({ si: 0, total: 0 });

  // Guard: only borrowers
  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'borrower') { router.replace('/dashboard/sales'); return; }
  }, [user, router]);

  // Load existing data
  useEffect(() => {
    if (!user) return;
    borrowerApi.getProfile().then(({ user: u }) => {
      if (u.fullName) setFullName(u.fullName);
      if (u.pan) setPan(u.pan);
      if (u.dob) setDob(u.dob.split('T')[0]);
      if (u.monthlySalary) setMonthlySalary(String(u.monthlySalary));
      if (u.employmentMode) setEmploymentMode(u.employmentMode);
    }).catch(() => {});

    borrowerApi.getMyApplication().then(({ loan }) => {
      if (loan) setExistingApp(loan);
    }).catch(() => {}).finally(() => setPageLoading(false));
  }, [user]);

  // Live interest preview
  useEffect(() => {
    const p = Number(loanAmount);
    const t = Number(tenureDays);
    if (p > 0 && t > 0) {
      const si = (p * 12 * t) / (365 * 100);
      setPreview({ si: Math.round(si * 100) / 100, total: Math.round((p + si) * 100) / 100 });
    }
  }, [loanAmount, tenureDays]);

  const handleLogout = () => { logout(); router.push('/login'); };

  // Step 2 → save profile
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await borrowerApi.updateProfile({
        fullName,
        pan: pan.toUpperCase(),
        dob,
        monthlySalary: Number(monthlySalary),
        employmentMode: employmentMode as EmploymentMode,
      });
      setStep(3);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 → upload salary slip
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!salarySlipFile) { setUploadError('Please select a file'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('salarySlip', salarySlipFile);
      const { filePath } = await borrowerApi.uploadSalarySlip(fd);
      setSalarySlipPath(filePath);
      setStep(4);
    } catch (err: unknown) {
      setUploadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 → apply
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBreErrors([]);
    setLoading(true);
    try {
      const { loan } = await borrowerApi.applyLoan({
        loanAmount: Number(loanAmount),
        tenureDays: Number(tenureDays),
        salarySlipPath,
      });
      setExistingApp(loan);
    } catch (err: unknown) {
      const e = err as Error & { errors?: string[] };
      if (e.errors?.length) setBreErrors(e.errors);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Show existing application status
  if (existingApp) {
    const borrower = existingApp.borrowerId as { fullName?: string; email?: string } | string;
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900">LMS Borrower Portal</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.fullName}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">Your Loan Application</h1>
              <StatusBadge status={existingApp.status} />
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Loan Amount', formatCurrency(existingApp.loanAmount)],
                ['Tenure', `${existingApp.tenureDays} days`],
                ['Interest Rate', `${existingApp.interestRate}% p.a.`],
                ['Simple Interest', formatCurrency(existingApp.simpleInterest)],
                ['Total Repayment', formatCurrency(existingApp.totalRepayment)],
                ['Total Paid', formatCurrency(existingApp.totalPaid)],
                ['Outstanding', formatCurrency(Math.max(0, existingApp.totalRepayment - existingApp.totalPaid))],
                ['Applied On', new Date(existingApp.createdAt).toLocaleDateString('en-IN')],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500 text-xs">{k}</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>

            {existingApp.status === 'REJECTED' && existingApp.rejectionReason && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                <p className="text-sm text-red-600 mt-1">{existingApp.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Profile' },
    { n: 3, label: 'Documents' },
    { n: 4, label: 'Loan' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">LMS Borrower Portal</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.fullName}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center mb-8 gap-0">
          {steps.map((s, idx) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                  ${step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className="text-xs text-gray-500 mt-1">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 transition-colors ${step > s.n ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">

          {/* Step 1: Account (already done via signup, just show and proceed) */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created</h2>
              <p className="text-sm text-gray-500 mb-6">You&apos;re logged in as <strong>{user?.email}</strong>. Let&apos;s complete your profile.</p>
              <Button onClick={() => setStep(2)} size="lg" className="w-full">
                Continue to Profile →
              </Button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Personal Details</h2>
              {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="PAN" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" required maxLength={10} />
              <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              <Input label="Monthly Salary (₹)" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} min={0} required />
              <Select
                label="Employment Mode"
                value={employmentMode}
                onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
                options={[
                  { value: 'Salaried', label: 'Salaried' },
                  { value: 'Self-Employed', label: 'Self-Employed' },
                  { value: 'Unemployed', label: 'Unemployed' },
                ]}
                required
              />
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" isLoading={loading} className="flex-1">Save & Continue →</Button>
              </div>
            </form>
          )}

          {/* Step 3: Upload Salary Slip */}
          {step === 3 && (
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Salary Slip</h2>
              <p className="text-sm text-gray-500">PDF, JPG, or PNG · Max 5 MB</p>
              {uploadError && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{uploadError}</div>}

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSalarySlipFile(f);
                  }}
                />
                {salarySlipFile ? (
                  <div className="text-sm text-green-700 font-medium">✓ {salarySlipFile.name}</div>
                ) : (
                  <div className="text-sm text-gray-500">Click to select file</div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" isLoading={loading} className="flex-1">Upload & Continue →</Button>
              </div>
            </form>
          )}

          {/* Step 4: Configure Loan */}
          {step === 4 && (
            <form onSubmit={handleApply} className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Configure Your Loan</h2>

              {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
              {breErrors.length > 0 && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">Eligibility check failed:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {breErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Loan Amount: {formatCurrency(Number(loanAmount))}</label>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full mt-2 accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹50,000</span><span>₹5,00,000</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tenure: {tenureDays} days</label>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={1}
                  value={tenureDays}
                  onChange={(e) => setTenureDays(e.target.value)}
                  className="w-full mt-2 accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30 days</span><span>365 days</span>
                </div>
              </div>

              {/* Loan preview */}
              <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-blue-500">Interest Rate</p>
                  <p className="font-semibold text-blue-900">12% p.a.</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Interest</p>
                  <p className="font-semibold text-blue-900">{formatCurrency(preview.si)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Total Repayment</p>
                  <p className="font-semibold text-blue-900">{formatCurrency(preview.total)}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(3)}>Back</Button>
                <Button type="submit" isLoading={loading} className="flex-1">Submit Application →</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
