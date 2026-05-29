'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { authApi } from '../../../lib/api';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

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

      // Route based on role
      if (user.role === 'borrower') {
        router.push('/apply');
      } else {
        const roleRoutes: Record<string, string> = {
          admin: '/dashboard/sales',
          sales: '/dashboard/sales',
          sanction: '/dashboard/sanction',
          disbursement: '/dashboard/disbursement',
          collection: '/dashboard/collection',
        };
        router.push(roleRoutes[user.role] || '/dashboard/sales');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Loan Management System</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" isLoading={loading} size="lg" className="mt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            New borrower?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo credentials helper */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">Demo Accounts</p>
          <div className="grid grid-cols-1 gap-1 text-xs text-blue-600">
            {[
              ['Admin', 'admin@lms.com', 'Admin@123'],
              ['Sales', 'sales@lms.com', 'Sales@123'],
              ['Sanction', 'sanction@lms.com', 'Sanction@123'],
              ['Disbursement', 'disbursement@lms.com', 'Disburse@123'],
              ['Collection', 'collection@lms.com', 'Collect@123'],
              ['Borrower', 'borrower@lms.com', 'Borrower@123'],
            ].map(([role, em, pw]) => (
              <button
                key={em}
                type="button"
                onClick={() => { setEmail(em); setPassword(pw); }}
                className="text-left hover:bg-blue-100 rounded px-1 py-0.5 transition-colors"
              >
                <span className="font-medium">{role}:</span> {em} / {pw}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
