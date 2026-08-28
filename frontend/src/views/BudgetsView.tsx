import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Budget, Category } from '../types';
import { BudgetModal } from '../components/BudgetModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { StatCard } from '../components/StatCard';

interface BudgetsViewProps {
  categories: Category[];
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  categories,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useNotification();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getBudgets(selectedYear, selectedMonth);
      if (res.success) {
        setBudgets(res.data || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load budgets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, showToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleCreateOrUpdate = async (data: {
    categoryId: string;
    year: number;
    month: number;
    amount: number;
  }) => {
    if (editingBudget) {
      await api.updateBudget(editingBudget.id, { amount: data.amount });
      showToast('Budget updated successfully!', 'success');
    } else {
      await api.createBudget(data);
      showToast('Budget target established!', 'success');
    }
    fetchBudgets();
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    try {
      await api.deleteBudget(deletingBudget.id);
      showToast('Budget deleted successfully', 'info');
      fetchBudgets();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete budget', 'error');
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
  const warningCount = budgets.filter((b) => b.status === 'warning').length;

  return (
    <div className="view-content">
      {/* Top Header & Year/Month Selector */}
      <div className="filter-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: '140px' }}
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
            style={{ width: '100px' }}
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

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Budget Allocated"
          value={formatCurrency(totalAllocated)}
          icon={Target}
          iconColor="#6366f1"
          iconBg="var(--accent-primary-light)"
          meta={`${budgets.length} budgeted categories`}
          glowBorderColor="var(--border-glow)"
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={PieChart}
          iconColor="var(--expense-rose)"
          iconBg="var(--expense-bg)"
          meta={totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% of total budget` : '0%'}
          glowBorderColor="var(--expense-border)"
        />
        <StatCard
          label="Remaining Balance"
          value={formatCurrency(totalRemaining)}
          icon={CheckCircle2}
          iconColor={totalRemaining >= 0 ? 'var(--income-green)' : 'var(--expense-rose)'}
          iconBg={totalRemaining >= 0 ? 'var(--income-bg)' : 'var(--expense-bg)'}
          trend={{
            text: totalRemaining >= 0 ? 'Within Budget' : 'Over Budget',
            isPositive: totalRemaining >= 0,
          }}
          glowBorderColor={totalRemaining >= 0 ? 'var(--income-border)' : 'var(--expense-border)'}
        />
        <StatCard
          label="Budget Health"
          value={`${budgets.length - exceededCount} / ${budgets.length} On Track`}
          icon={AlertTriangle}
          iconColor={exceededCount > 0 ? 'var(--expense-rose)' : warningCount > 0 ? 'var(--warning-amber)' : 'var(--income-green)'}
          iconBg={exceededCount > 0 ? 'var(--expense-bg)' : 'var(--income-bg)'}
          meta={exceededCount > 0 ? `${exceededCount} categories exceeded` : warningCount > 0 ? `${warningCount} categories in warning (>80%)` : 'All budgets healthy'}
          glowBorderColor={exceededCount > 0 ? 'var(--expense-border)' : undefined}
        />
      </div>

      {/* Budgets Grid List */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">
            <Target size={18} />
            Category Budget Limits ({months[selectedMonth - 1]} {selectedYear})
          </h3>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" color="var(--accent-primary)" />
            <p>Evaluating category budgets and spending progress...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state">
            <p>No budgets set for {months[selectedMonth - 1]} {selectedYear}.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Set First Budget Target
            </button>
          </div>
        ) : (
          <div className="responsive-grid-auto">
            {budgets.map((budget) => {
              const progressPct = Math.min(100, budget.percentageUsed);
              const isOver = budget.status === 'exceeded';
              const isWarning = budget.status === 'warning';

              return (
                <div
                  key={budget.id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-surface)',
                    borderColor: isOver ? 'var(--expense-border)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="color-dot" style={{ background: budget.categoryColor || '#6366f1', width: '12px', height: '12px' }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{budget.categoryName}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Edit Budget"
                        onClick={() => {
                          setEditingBudget(budget);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: '28px', height: '28px', color: 'var(--expense-rose)' }}
                        title="Delete Budget"
                        onClick={() => setDeletingBudget(budget)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(budget.spentAmount)}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> of {formatCurrency(budget.amount)}</span>
                    </div>

                    <span
                      className="category-pill"
                      style={{
                        background: isOver ? 'var(--expense-bg)' : isWarning ? 'var(--warning-bg)' : 'var(--income-bg)',
                        color: isOver ? 'var(--expense-rose)' : isWarning ? 'var(--warning-amber)' : 'var(--income-green)',
                        borderColor: isOver ? 'var(--expense-border)' : 'var(--income-border)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {budget.percentageUsed.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-track" style={{ height: '8px', marginBottom: '0.65rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progressPct}%`,
                        background: isOver
                          ? 'var(--expense-rose)'
                          : isWarning
                          ? 'var(--warning-amber)'
                          : budget.categoryColor || 'var(--income-green)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>
                      {isOver ? (
                        <span style={{ color: 'var(--expense-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertCircle size={14} /> Over by {formatCurrency(Math.abs(budget.remainingAmount))}
                        </span>
                      ) : (
                        <span>Remaining: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(budget.remainingAmount)}</strong></span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {budget.percentageUsed >= 100 ? '100% used' : `${(100 - budget.percentageUsed).toFixed(0)}% left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Modal (Add/Edit) */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        initialData={editingBudget}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        title="Delete Budget Target"
        message={`Are you sure you want to remove the budget limit for "${deletingBudget?.categoryName}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
