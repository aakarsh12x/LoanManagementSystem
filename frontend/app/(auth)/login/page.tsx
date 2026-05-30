'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { authApi } from '../../../lib/api';
import { Input } from '../../../components/ui/Input';
import { BackgroundBeamsWithCollision } from '../../../components/ui/aceternity/background-beams-collision';
import { BorderBeam } from '../../../components/ui/magic/border-beam';
import { ShimmerButton } from '../../../components/ui/magic/shimmer-button';

const DEMO_ACCOUNTS = [
  { role: 'Admin',        email: 'admin@lms.com',        password: 'Admin@123' },
  { role: 'Sales',        email: 'sales@lms.com',        password: 'Sales@123' },
  { role: 'Sanction',     email: 'sanction@lms.com',     password: 'Sanction@123' },
  { role: 'Disbursement', email: 'disbursement@lms.com', password: 'Disburse@123' },
  { role: 'Collection',   email: 'collection@lms.com',   password: 'Collect@123' },
  { role: 'Borrower',     email: 'borrower@lms.com',     password: 'Borrower@123' },
] as const;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password });
      login(token, user);
      const roleRoutes: Record<string, string> = {
        borrower:     '/apply',
        admin:        '/dashboard/sales',
        sales:        '/dashboard/sales',
        sanction:     '/dashboard/sanction',
        disbursement: '/dashboard/disbursement',
        collection:   '/dashboard/collection',
      };
      router.push(roleRoutes[user.role] || '/apply');
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundBeamsWithCollision className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300 tracking-wide">Loan Management System</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-neutral-400 text-sm mt-1">Sign in to your account to continue</p>
        </div>

        {/* Login Card */}
        <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <BorderBeam
            size={300}
            duration={12}
            colorFrom="#6366f1"
            colorTo="#a855f7"
          />

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Custom dark inputs */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="mt-2 h-11 text-sm rounded-xl"
              background="rgba(79, 70, 229, 1)"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in →'
              )}
            </ShimmerButton>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-500">
            New borrower?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="rounded-2xl bg-white/3 border border-white/8 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.map(({ role, email: em, password: pw }) => (
              <button
                key={em}
                type="button"
                onClick={() => { setEmail(em); setPassword(pw); }}
                className="text-left rounded-lg px-3 py-2 text-xs transition-all hover:bg-white/10 border border-transparent hover:border-white/10 group"
              >
                <span className="block font-semibold text-indigo-400 group-hover:text-indigo-300">{role}</span>
                <span className="block text-neutral-500 truncate group-hover:text-neutral-400">{em}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </BackgroundBeamsWithCollision>
  );
}
