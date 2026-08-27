import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Receipt,
  Plus,
  Loader2,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { MonthlyReport, CategoryBreakdownItem, Expense, Income } from '../types';

interface DashboardViewProps {
  selectedYear: number;
  selectedMonth: number;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal?: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedYear,
  selectedMonth,
  onOpenExpenseModal,
  onNavigateTab,
}) => {
  const { formatCurrency } = useAuth();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentIncome, setRecentIncome] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [reportRes, breakdownRes, expenseRes, incomeRes] = await Promise.allSettled([
          api.getMonthlyReport(selectedYear, selectedMonth),
          api.getCategoryBreakdown(selectedYear, selectedMonth),
          api.getExpenses({ limit: 5, sortBy: 'expenseDate', sortOrder: 'desc' }),
          api.getIncome({ limit: 5, sortBy: 'incomeDate', sortOrder: 'desc' }),
        ]);

        if (isMounted) {
          if (reportRes.status === 'fulfilled' && reportRes.value.success) {
            setReport(reportRes.value.data.report);
          }
          if (breakdownRes.status === 'fulfilled' && breakdownRes.value.success) {
            setBreakdown(breakdownRes.value.data.breakdown || []);
          }
          if (expenseRes.status === 'fulfilled' && expenseRes.value.success) {
            setRecentExpenses(expenseRes.value.data || []);
          }
          if (incomeRes.status === 'fulfilled' && incomeRes.value.success) {
            setRecentIncome(incomeRes.value.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedMonth]);

  const totalIncome = report?.totalIncome || 0;
  const totalExpenses = report?.totalExpenses || 0;
  const balance = report?.balance || (totalIncome - totalExpenses);
  const savingsRate = report?.savingsRatePercentage || 0;

  // Max for ratio comparison
  const maxFlow = Math.max(totalIncome, totalExpenses, 1);
  const incomePct = Math.min(100, Math.round((totalIncome / maxFlow) * 100));
  const expensePct = Math.min(100, Math.round((totalExpenses / maxFlow) * 100));

  // Combine recent activity
  const combinedTransactions = [
    ...recentExpenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: e.description || e.category?.name || 'Expense',
      subtitle: e.category?.name || 'General',
      amount: e.amount,
      date: e.expenseDate,
      color: e.category?.color || '#f43f5e',
    })),
    ...recentIncome.map((i) => ({
      id: i.id,
      type: 'income' as const,
      title: i.source,
      subtitle: i.description || 'Income',
      amount: i.amount,
      date: i.incomeDate,
      color: '#10b981',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return (
    <div className="view-content">
      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          iconColor="var(--income-green)"
          iconBg="var(--income-bg)"
          meta={`${report?.incomeCount || 0} transactions`}
          glowBorderColor="var(--income-border)"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          iconColor="var(--expense-rose)"
          iconBg="var(--expense-bg)"
          meta={`${report?.expenseCount || 0} transactions`}
          glowBorderColor="var(--expense-border)"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(balance)}
          icon={Wallet}
          iconColor="#8b5cf6"
          iconBg="rgba(139, 92, 246, 0.15)"
          trend={{
            text: balance >= 0 ? 'Surplus' : 'Deficit',
            isPositive: balance >= 0,
          }}
          glowBorderColor="rgba(139, 92, 246, 0.35)"
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          iconColor="#06b6d4"
          iconBg="var(--info-bg)"
          meta={savingsRate >= 20 ? 'Healthy Financial Goal (>20%)' : 'Opportunity to save more'}
          glowBorderColor="rgba(6, 182, 212, 0.35)"
        />
      </div>

      {/* Analytics Charts & Visuals */}
      <div className="chart-grid">
        {/* Cashflow Comparison Progress Bar */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">
              <Receipt size={18} />
              Monthly Cash Flow Overview
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Month {selectedMonth}/{selectedYear}
            </span>
          </div>

          <div className="cashflow-comparison">
            <div className="progress-group">
              <div className="progress-labels">
                <span style={{ color: 'var(--income-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingUp size={16} /> Total Income
                </span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(totalIncome)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill income" style={{ width: `${incomePct}%` }} />
              </div>
            </div>

            <div className="progress-group">
              <div className="progress-labels">
                <span style={{ color: 'var(--expense-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingDown size={16} /> Total Expenses
                </span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill expense" style={{ width: `${expensePct}%` }} />
              </div>
            </div>

            <div className="progress-group">
              <div className="progress-labels">
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PiggyBank size={16} /> Savings Proportion
                </span>
                <span style={{ fontWeight: 700 }}>{savingsRate > 0 ? `${savingsRate.toFixed(1)}%` : '0%'}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill savings" style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Sidebar Widget */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">Top Spending Categories</h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
              onClick={() => onNavigateTab('reports')}
            >
              View All
            </button>
          </div>

          {breakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem 0' }}>
              <p style={{ fontSize: '0.85rem' }}>No expenses recorded for this month yet.</p>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={onOpenExpenseModal}>
                <Plus size={14} /> Add First Expense
              </button>
            </div>
          ) : (
            <div className="category-breakdown-list">
              {breakdown.slice(0, 4).map((item) => (
                <div key={item.categoryId} className="category-breakdown-item">
                  <div className="category-item-header">
                    <span className="category-badge-chip">
                      <span className="color-dot" style={{ background: item.color || '#6366f1' }} />
                      {item.categoryName}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.percentage}%`,
                        background: item.color || 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => onNavigateTab('expenses')}>
              All Expenses
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => onNavigateTab('income')}>
              All Income
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" color="var(--accent-primary)" />
            <p>Loading transactions...</p>
          </div>
        ) : combinedTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Receipt size={24} />
            </div>
            <p>No recent activity found. Start by recording your income or an expense!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Category / Source</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {combinedTransactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.id}`}>
                    <td>
                      <span
                        className="category-pill"
                        style={{
                          background: tx.type === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)',
                          color: tx.type === 'income' ? 'var(--income-green)' : 'var(--expense-rose)',
                          borderColor: tx.type === 'income' ? 'var(--income-border)' : 'var(--expense-border)',
                        }}
                      >
                        {tx.type === 'income' ? '+' : '-'} {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.title}</td>
                    <td>
                      <span className="category-pill">
                        <span className="color-dot" style={{ background: tx.color }} />
                        {tx.subtitle}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={tx.type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
