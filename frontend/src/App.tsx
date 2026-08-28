import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { TransactionModal } from './components/TransactionModal';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ExpensesView } from './views/ExpensesView';
import { IncomeView } from './views/IncomeView';
import { CategoriesView } from './views/CategoriesView';
import { BudgetsView } from './views/BudgetsView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { api } from './services/api';
import type { Category } from './types';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { showToast } = useNotification();

  const now = new Date();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Mobile Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Categories cache
  const [categories, setCategories] = useState<Category[]>([]);

  // Quick Global Transaction Modals (triggered from Top Navbar)
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState<boolean>(false);
  const [isQuickIncomeOpen, setIsQuickIncomeOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getCategories();
      if (res.success && res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleGlobalCreateExpense = async (data: {
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate: string;
  }) => {
    await api.createExpense(data);
    showToast('Expense recorded successfully!', 'success');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGlobalCreateIncome = async (data: {
    amount: number;
    source: string;
    description?: string;
    incomeDate: string;
  }) => {
    await api.createIncome(data);
    showToast('Income recorded successfully!', 'success');
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Loader2 size={40} className="spin-icon" color="var(--accent-primary)" />
        <p style={{ fontWeight: 600 }}>Loading FinFlow Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="app-container">
      {/* Sidebar (Desktop sticky & Mobile slide-out drawer) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          currentTab={currentTab}
          onOpenExpenseModal={() => setIsQuickExpenseOpen(true)}
          onOpenIncomeModal={() => setIsQuickIncomeOpen(true)}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="main-scroll-area" key={`${currentTab}-${refreshTrigger}`}>
          {currentTab === 'dashboard' && (
            <DashboardView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onOpenExpenseModal={() => setIsQuickExpenseOpen(true)}
              onOpenIncomeModal={() => setIsQuickIncomeOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              categories={categories}
              onRefreshData={() => setRefreshTrigger((p) => p + 1)}
            />
          )}

          {currentTab === 'income' && (
            <IncomeView
              categories={categories}
              onRefreshData={() => setRefreshTrigger((p) => p + 1)}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onRefreshCategories={fetchCategories}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsView
              categories={categories}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          )}

          {currentTab === 'subscriptions' && (
            <SubscriptionsView categories={categories} />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>

        {/* Mobile Phone Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />
      </div>

      {/* Quick Global Expense Modal */}
      <TransactionModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        mode="expense"
        categories={categories}
        onSubmitExpense={handleGlobalCreateExpense}
      />

      {/* Quick Global Income Modal */}
      <TransactionModal
        isOpen={isQuickIncomeOpen}
        onClose={() => setIsQuickIncomeOpen(false)}
        mode="income"
        categories={categories}
        onSubmitIncome={handleGlobalCreateIncome}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
