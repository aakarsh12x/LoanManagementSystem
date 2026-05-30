const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lms_token');
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  isFormData?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;
  const token = options.token ?? getToken();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed') as Error & { status: number; errors?: string[] };
    error.status = res.status;
    if (data.errors) error.errors = data.errors;
    throw error;
  }
  return data as T;
}

// Auth
export const authApi = {
  signup: (body: { fullName: string; email: string; password: string }) =>
    request<{ token: string; user: import('../types').User }>('/api/auth/signup', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: import('../types').User }>('/api/auth/login', { method: 'POST', body }),
  me: () =>
    request<{ user: import('../types').User }>('/api/auth/me'),
};

// Borrower
export const borrowerApi = {
  getProfile: () =>
    request<{ user: import('../types').User }>('/api/borrower/profile'),
  updateProfile: (body: Partial<import('../types').User>) =>
    request<{ user: import('../types').User }>('/api/borrower/profile', { method: 'PUT', body }),
  uploadSalarySlip: (formData: FormData) =>
    request<{ filePath: string; fileName: string }>('/api/borrower/upload-salary-slip', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),
  applyLoan: (body: { loanAmount: number; tenureDays: number; salarySlipPath?: string }) =>
    request<{ loan: import('../types').LoanApplication }>('/api/borrower/apply', { method: 'POST', body }),
  getMyApplication: () =>
    request<{ loan: import('../types').LoanApplication | null }>('/api/borrower/application'),
};

// Dashboard
export const dashboardApi = {
  getSales: () =>
    request<{ users: import('../types').User[]; total: number }>('/api/dashboard/sales'),
  createBorrower: (body: { fullName: string; email: string; password?: string }) =>
    request<{ message: string; user: import('../types').User }>('/api/dashboard/sales', { method: 'POST', body }),
  getSanction: () =>
    request<{ loans: import('../types').LoanApplication[]; total: number }>('/api/dashboard/sanction'),
  sanctionAction: (id: string, body: { action: 'approve' | 'reject'; rejectionReason?: string }) =>
    request<{ loan: import('../types').LoanApplication }>(`/api/dashboard/sanction/${id}`, { method: 'PUT', body }),
  getDisbursement: () =>
    request<{ loans: import('../types').LoanApplication[]; total: number }>('/api/dashboard/disbursement'),
  disburseLoan: (id: string) =>
    request<{ loan: import('../types').LoanApplication }>(`/api/dashboard/disbursement/${id}`, { method: 'PUT' }),
  getCollection: () =>
    request<{ loans: (import('../types').LoanApplication & { payments: import('../types').Payment[] })[]; total: number }>('/api/dashboard/collection'),
  recordPayment: (id: string, body: { amount: number; utr: string; paymentDate: string }) =>
    request<{ payment: import('../types').Payment; loan: { status: string; totalPaid: number; totalRepayment: number } }>(`/api/dashboard/collection/${id}/payment`, { method: 'POST', body }),
};

export default request;
