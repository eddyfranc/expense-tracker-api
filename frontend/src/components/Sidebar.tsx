import React from 'react';
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Tags,
  BarChart3,
  Target,
  Repeat,
  Settings,
  LogOut,
  Wallet,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export type NavTab = 'dashboard' | 'expenses' | 'income' | 'categories' | 'budgets' | 'subscriptions' | 'reports' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: TrendingDown },
    { id: 'income' as NavTab, label: 'Income', icon: TrendingUp },
    { id: 'categories' as NavTab, label: 'Categories', icon: Tags },
    { id: 'budgets' as NavTab, label: 'Monthly Budgets', icon: Target },
    { id: 'subscriptions' as NavTab, label: 'Subscriptions & Bills', icon: Repeat },
    { id: 'reports' as NavTab, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-icon">
          <Wallet size={22} />
        </div>
        <div className="brand-title">
          <span>FinFlow</span>
          <span className="brand-subtitle">Expense Tracker</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* User Card */}
        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-info">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            style={{ flex: 1 }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={logout}
            className="btn btn-danger btn-icon"
            style={{ flex: 1 }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
