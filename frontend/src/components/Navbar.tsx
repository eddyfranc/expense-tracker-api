import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenExpenseModal,
  onOpenIncomeModal,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Real-time financial summary and cash flow tracking',
    },
    expenses: {
      title: 'Expense Tracker',
      subtitle: 'Manage and categorize your personal spending',
    },
    income: {
      title: 'Income Logs',
      subtitle: 'Record and organize your earnings and revenues',
    },
    categories: {
      title: 'Categories',
      subtitle: 'Customize spending buckets, colors, and icons',
    },
    budgets: {
      title: 'Monthly Budgets & Limits',
      subtitle: 'Set category spending limits and monitor budget health',
    },
    subscriptions: {
      title: 'Recurring Subscriptions & Bills',
      subtitle: 'Track fixed commitments and upcoming renewals',
    },
    reports: {
      title: 'Analytics & Reports',
      subtitle: 'Monthly comparisons, savings rate, and category distribution',
    },
    settings: {
      title: 'Account Settings',
      subtitle: 'Manage profile preferences and currency configuration',
    },
  };

  const currentInfo = titles[currentTab] || { title: 'Overview', subtitle: '' };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        <div>
          <h1 className="view-title">{currentInfo.title}</h1>
          <p className="view-subtitle">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="top-navbar-right">
        {/* Month / Year Selectors */}
        {(currentTab === 'dashboard' || currentTab === 'reports' || currentTab === 'budgets') && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              style={{ width: '90px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Action Buttons */}
        <button
          className="btn btn-expense"
          onClick={onOpenExpenseModal}
          title="Add new expense transaction"
        >
          <ArrowDownRight size={16} />
          <span>Expense</span>
        </button>
        <button
          className="btn btn-income"
          onClick={onOpenIncomeModal}
          title="Add new income transaction"
        >
          <ArrowUpRight size={16} />
          <span>Income</span>
        </button>
      </div>
    </header>
  );
};
