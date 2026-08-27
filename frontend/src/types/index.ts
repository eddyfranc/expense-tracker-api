export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  amountCents: number;
  description?: string | null;
  expenseDate: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  amountCents: number;
  source: string;
  description?: string | null;
  incomeDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRatePercentage: number;
  expenseCount: number;
  incomeCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon?: string;
  totalAmount: number;
  totalAmountCents: number;
  percentage: number;
  count: number;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  year: number;
  month: number;
  amount: number;
  amountCents: number;
  spentAmount: number;
  spentAmountCents: number;
  remainingAmount: number;
  remainingAmountCents: number;
  percentageUsed: number;
  status: 'under' | 'warning' | 'exceeded';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  name: string;
  amount: number;
  amountCents: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  status: 'active' | 'paused' | 'cancelled';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSummary {
  totalActive: number;
  estimatedMonthlyBurn: number;
  upcomingIn7Days: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
