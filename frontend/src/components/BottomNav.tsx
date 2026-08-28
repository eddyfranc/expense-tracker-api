import React from 'react';
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Target,
  Menu,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenMobileMenu,
}) => {
  const isMoreActive =
    currentTab === 'categories' ||
    currentTab === 'subscriptions' ||
    currentTab === 'reports' ||
    currentTab === 'settings';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
        aria-label="Go to Dashboard"
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </button>

      <button
        className={`bottom-nav-item ${currentTab === 'expenses' ? 'active' : ''}`}
        onClick={() => onTabChange('expenses')}
        aria-label="Go to Expenses"
      >
        <TrendingDown size={20} />
        <span>Expenses</span>
      </button>

      <button
        className={`bottom-nav-item ${currentTab === 'income' ? 'active' : ''}`}
        onClick={() => onTabChange('income')}
        aria-label="Go to Income"
      >
        <TrendingUp size={20} />
        <span>Income</span>
      </button>

      <button
        className={`bottom-nav-item ${currentTab === 'budgets' ? 'active' : ''}`}
        onClick={() => onTabChange('budgets')}
        aria-label="Go to Budgets"
      >
        <Target size={20} />
        <span>Budgets</span>
      </button>

      <button
        className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
        onClick={onOpenMobileMenu}
        aria-label="Open Full Menu"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
