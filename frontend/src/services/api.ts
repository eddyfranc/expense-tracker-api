import type {
  User,
  AuthResponseData,
  Category,
  Expense,
  Income,
  MonthlyReport,
  CategoryBreakdownItem,
  Budget,
  Subscription,
  SubscriptionSummary,
  PaginatedResponse,
  ApiResponse,
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private getAccessToken(): string | null {
    return localStorage.getItem('finflow_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('finflow_refresh_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('finflow_access_token', accessToken);
    localStorage.setItem('finflow_refresh_token', refreshToken);
  }

  public clearTokens() {
    localStorage.removeItem('finflow_access_token');
    localStorage.removeItem('finflow_refresh_token');
    localStorage.removeItem('finflow_user');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  public async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // --- Auth Endpoints ---
  public async register(payload: { email: string; password: string; firstName: string; lastName: string }): Promise<ApiResponse<AuthResponseData>> {
    return this.request<ApiResponse<AuthResponseData>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(payload: { email: string; password: string }): Promise<ApiResponse<AuthResponseData>> {
    return this.request<ApiResponse<AuthResponseData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>('/users/me');
  }

  public async updateProfile(payload: { firstName?: string; lastName?: string; currency?: string }): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // --- Categories Endpoints ---
  public async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return this.request<ApiResponse<{ categories: Category[] }>>('/categories');
  }

  public async createCategory(payload: { name: string; description?: string; color?: string; icon?: string }): Promise<ApiResponse<{ category: Category }>> {
    return this.request<ApiResponse<{ category: Category }>>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateCategory(id: string, payload: { name?: string; description?: string; color?: string; icon?: string }): Promise<ApiResponse<{ category: Category }>> {
    return this.request<ApiResponse<{ category: Category }>>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Expenses Endpoints ---
  public async getExpenses(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<Expense>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
    return this.request<PaginatedResponse<Expense>>(`/expenses?${query.toString()}`);
  }

  public async createExpense(payload: { categoryId: string; amount: number; description?: string; expenseDate?: string }): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request<ApiResponse<{ expense: Expense }>>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateExpense(id: string, payload: { categoryId?: string; amount?: number; description?: string; expenseDate?: string }): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request<ApiResponse<{ expense: Expense }>>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteExpense(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Income Endpoints ---
  public async getIncome(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<Income>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
    return this.request<PaginatedResponse<Income>>(`/income?${query.toString()}`);
  }

  public async createIncome(payload: { amount: number; source: string; description?: string; incomeDate?: string }): Promise<ApiResponse<{ income: Income }>> {
    return this.request<ApiResponse<{ income: Income }>>('/income', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateIncome(id: string, payload: { amount?: number; source?: string; description?: string; incomeDate?: string }): Promise<ApiResponse<{ income: Income }>> {
    return this.request<ApiResponse<{ income: Income }>>(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteIncome(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/income/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Reports Endpoints ---
  public async getMonthlyReport(year: number, month: number): Promise<ApiResponse<{ report: MonthlyReport }>> {
    return this.request<ApiResponse<{ report: MonthlyReport }>>(`/reports/monthly?year=${year}&month=${month}`);
  }

  public async getCategoryBreakdown(year: number, month: number): Promise<ApiResponse<{ breakdown: CategoryBreakdownItem[] }>> {
    return this.request<ApiResponse<{ breakdown: CategoryBreakdownItem[] }>>(`/reports/category-breakdown?year=${year}&month=${month}`);
  }

  // --- Budgets Endpoints ---
  public async getBudgets(year?: number, month?: number): Promise<ApiResponse<Budget[]>> {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<ApiResponse<Budget[]>>(`/budgets?${query.toString()}`);
  }

  public async createBudget(payload: { categoryId: string; year: number; month: number; amount: number }): Promise<ApiResponse<Budget>> {
    return this.request<ApiResponse<Budget>>('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateBudget(id: string, payload: { amount: number }): Promise<ApiResponse<Budget>> {
    return this.request<ApiResponse<Budget>>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteBudget(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Subscriptions Endpoints ---
  public async getSubscriptions(status?: string): Promise<ApiResponse<{ subscriptions: Subscription[]; summary: SubscriptionSummary }>> {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    return this.request<ApiResponse<{ subscriptions: Subscription[]; summary: SubscriptionSummary }>>(`/subscriptions?${query.toString()}`);
  }

  public async createSubscription(payload: {
    name: string;
    categoryId: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    nextBillingDate: string;
    status?: 'active' | 'paused' | 'cancelled';
    description?: string;
  }): Promise<ApiResponse<Subscription>> {
    return this.request<ApiResponse<Subscription>>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateSubscription(id: string, payload: Partial<{
    name: string;
    categoryId: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    nextBillingDate: string;
    status: 'active' | 'paused' | 'cancelled';
    description: string | null;
  }>): Promise<ApiResponse<Subscription>> {
    return this.request<ApiResponse<Subscription>>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteSubscription(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Health Check ---
  public async getHealth(): Promise<{ success: boolean; status: string; database: string; version: string }> {
    return this.request<{ success: boolean; status: string; database: string; version: string }>('/health');
  }
}

export const api = new ApiService();
