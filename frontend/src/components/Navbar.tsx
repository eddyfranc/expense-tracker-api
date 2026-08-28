import React from 'react';
import { ArrowDownRight, ArrowUpRight, Menu } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenExpenseModal,
  onOpenIncomeModal,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onToggleSidebar,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Real-time financial summary and cash flow tracking',
    },
    expenses: {
      title: 'Expenses',
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
      title: 'Budgets & Limits',
      subtitle: 'Set category spending limits and monitor budget health',
    },
    subscriptions: {
      title: 'Subscriptions',
      subtitle: 'Track fixed commitments and upcoming renewals',
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Monthly comparisons, savings rate, and breakdown',
    },
    settings: {
      title: 'Account Settings',
      subtitle: 'Manage profile preferences and currency configuration',
    },
  };

  const currentInfo = titles[currentTab] || { title: 'Overview', subtitle: '' };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        {/* Mobile Hamburger Toggle */}
        <button
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-titles">
          <h1 className="view-title">{currentInfo.title}</h1>
          <p className="view-subtitle">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="top-navbar-right">
        {/* Month / Year Selectors */}
        {(currentTab === 'dashboard' || currentTab === 'reports' || currentTab === 'budgets') && (
          <div className="navbar-date-selectors">
            <select
              className="form-select navbar-month-select"
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              aria-label="Select month"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="form-select navbar-year-select"
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              aria-label="Select year"
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
        <div className="navbar-action-buttons">
          <button
            className="btn btn-expense btn-quick-action"
            onClick={onOpenExpenseModal}
            title="Add new expense transaction"
          >
            <ArrowDownRight size={16} />
            <span className="btn-label-text">Expense</span>
          </button>
          <button
            className="btn btn-income btn-quick-action"
            onClick={onOpenIncomeModal}
            title="Add new income transaction"
          >
            <ArrowUpRight size={16} />
            <span className="btn-label-text">Income</span>
          </button>
        </div>
      </div>
    </header>
  );
};
