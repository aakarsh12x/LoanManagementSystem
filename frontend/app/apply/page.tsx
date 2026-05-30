'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { borrowerApi } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { NumberTicker } from '../../components/ui/magic/number-ticker';
import { BackgroundBeamsWithCollision } from '../../components/ui/aceternity/background-beams-collision';
import { BorderBeam } from '../../components/ui/magic/border-beam';
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

  // Poll for application status updates
  useEffect(() => {
    if (!existingApp) return;
    // Don't poll if final state is reached
    if (existingApp.status === 'CLOSED' || existingApp.status === 'REJECTED') return;

    const interval = setInterval(() => {
      borrowerApi.getMyApplication().then(({ loan }) => {
        if (loan) {
          // Update state if status, repayment details, or payments have changed
          if (
            loan.status !== existingApp.status ||
            loan.totalPaid !== existingApp.totalPaid ||
            loan.rejectionReason !== existingApp.rejectionReason
          ) {
            setExistingApp(loan);
          }
        }
      }).catch(() => {});
    }, 3000); // Poll every 3 seconds for fast feedback during evaluation!

    return () => clearInterval(interval);
  }, [existingApp]);

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

  // Clear all errors on step navigation
  const goToStep = (s: Step) => {
    setError('');
    setBreErrors([]);
    setUploadError('');
    setStep(s);
  };

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
      goToStep(3);
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
      goToStep(4);
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // Show existing application status
  if (existingApp) {
    const borrower = existingApp.borrowerId as { fullName?: string; email?: string } | string;
    return (
      <BackgroundBeamsWithCollision className="flex flex-col min-h-screen text-white">
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <span className="font-semibold text-emerald-400 tracking-wide">LMS Borrower Portal</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-300 font-medium">{user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-400 hover:text-rose-400 transition-colors font-medium animate-pulse hover:animate-none"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 z-10">
          <div className="relative w-full max-w-2xl bg-neutral-900/60 border border-white/10 p-8 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <BorderBeam />
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h1 className="text-2xl font-bold text-white tracking-tight">Your Loan Application</h1>
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
                <div key={k} className="bg-white/5 rounded-xl border border-white/5 p-4 hover:bg-white/10 transition-colors">
                  <dt className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">{k}</dt>
                  <dd className="font-bold text-white text-lg mt-1.5" suppressHydrationWarning>{v}</dd>
                </div>
              ))}
            </dl>

            {existingApp.status === 'REJECTED' && existingApp.rejectionReason && (
              <div className="mt-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                <p className="text-sm font-semibold text-rose-400">Rejection Reason</p>
                <p className="text-sm text-rose-300 mt-1">{existingApp.rejectionReason}</p>
              </div>
            )}

            {(existingApp.status === 'REJECTED' || existingApp.status === 'CLOSED') && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <Button
                  onClick={() => {
                    setExistingApp(null);
                    setStep(2); // Go to profile step to check/update profile details
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Start New Application
                </Button>
              </div>
            )}
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    );
  }

  const steps = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Profile' },
    { n: 3, label: 'Documents' },
    { n: 4, label: 'Loan' },
  ];

  return (
    <BackgroundBeamsWithCollision className="flex flex-col min-h-screen text-white">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <span className="font-semibold text-emerald-400 tracking-wide">LMS Borrower Portal</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-300 font-medium">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-400 hover:text-rose-400 transition-colors font-medium animate-pulse hover:animate-none"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div className="w-full max-w-xl">
          {/* Step indicator */}
          <div className="flex items-center mb-8 gap-0">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className={`flex flex-col items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border
                    ${step === s.n
                      ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 ring-4 ring-emerald-500/20'
                      : step > s.n
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-neutral-900 border-white/10 text-neutral-500'}`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${step === s.n ? 'text-emerald-400' : 'text-neutral-500'}`}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-[1px] flex-1 mb-5 transition-all ${step > s.n ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="relative w-full bg-neutral-900/60 border border-white/10 p-8 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <BorderBeam />

            {/* Step 1: Account (already done via signup, just show and proceed) */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Account Created</h2>
                <p className="text-sm text-neutral-400 mb-6">You&apos;re logged in as <strong className="text-emerald-400">{user?.email}</strong>. Let&apos;s complete your profile.</p>
                <Button
                  onClick={() => goToStep(2)}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  Continue to Profile →
                </Button>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Personal Details</h2>
                {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">{error}</div>}
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
                <div className="flex gap-3 mt-4 border-t border-white/5 pt-4">
                  <Button type="button" variant="ghost" onClick={() => goToStep(1)} className="text-neutral-400 hover:text-white">Back</Button>
                  <Button type="submit" isLoading={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Save & Continue →</Button>
                </div>
              </form>
            )}

            {/* Step 3: Upload Salary Slip */}
            {step === 3 && (
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Upload Salary Slip</h2>
                <p className="text-sm text-neutral-400">PDF, JPG, or PNG · Max 5 MB</p>
                {uploadError && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">{uploadError}</div>}

                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all"
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
                    <div className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-2">
                      <span>✓</span>
                      <span>{salarySlipFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-500 flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Click to select file or drag here</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4 border-t border-white/5 pt-4">
                  <Button type="button" variant="ghost" onClick={() => goToStep(2)} className="text-neutral-400 hover:text-white">Back</Button>
                  <Button type="submit" isLoading={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Upload & Continue →</Button>
                </div>
              </form>
            )}

            {/* Step 4: Configure Loan */}
            {step === 4 && (
              <form onSubmit={handleApply} className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Configure Your Loan</h2>

                {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">{error}</div>}
                {breErrors.length > 0 && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                    <p className="text-sm font-semibold text-rose-400 mb-2">Eligibility check failed:</p>
                    <ul className="list-disc list-inside text-sm text-rose-300 space-y-1">
                      {breErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-300">Loan Amount: <span className="text-emerald-400 font-bold">{formatCurrency(Number(loanAmount))}</span></label>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full mt-2 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>₹50,000</span><span>₹5,00,000</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-300">Tenure: <span className="text-emerald-400 font-bold">{tenureDays} days</span></label>
                  <input
                    type="range"
                    min={30}
                    max={365}
                    step={1}
                    value={tenureDays}
                    onChange={(e) => setTenureDays(e.target.value)}
                    className="w-full mt-2 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>30 days</span><span>365 days</span>
                  </div>
                </div>

                {/* Loan preview — Number Ticker */}
                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-xl p-4 grid grid-cols-3 gap-3 text-center shadow-inner mt-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-400/70 mb-1 uppercase tracking-wider">Interest Rate</p>
                    <p className="font-bold text-white text-lg">12% p.a.</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400/70 mb-1 uppercase tracking-wider">Interest (₹)</p>
                    <p className="font-bold text-emerald-400 text-lg">
                      <NumberTicker
                        key={preview.si}
                        value={preview.si}
                        decimalPlaces={0}
                        className="text-emerald-400"
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-400/70 mb-1 uppercase tracking-wider">Repayment (₹)</p>
                    <p className="font-bold text-teal-400 text-lg">
                      <NumberTicker
                        key={preview.total}
                        value={preview.total}
                        decimalPlaces={0}
                        className="text-teal-400"
                      />
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 border-t border-white/5 pt-4">
                  <Button type="button" variant="ghost" onClick={() => goToStep(3)} className="text-neutral-400 hover:text-white">Back</Button>
                  <Button type="submit" isLoading={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Submit Application →</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
