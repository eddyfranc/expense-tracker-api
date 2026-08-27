import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
  PieChart,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { MonthlyReport, CategoryBreakdownItem } from '../types';
import { StatCard } from '../components/StatCard';

interface ReportsViewProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useNotification();

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      try {
        setIsLoading(true);
        const [reportRes, breakdownRes] = await Promise.allSettled([
          api.getMonthlyReport(selectedYear, selectedMonth),
          api.getCategoryBreakdown(selectedYear, selectedMonth),
        ]);

        if (isMounted) {
          if (reportRes.status === 'fulfilled' && reportRes.value.success) {
            setReport(reportRes.value.data.report);
          }
          if (breakdownRes.status === 'fulfilled' && breakdownRes.value.success) {
            setBreakdown(breakdownRes.value.data.breakdown || []);
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load report analytics', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedMonth, showToast]);

  const handleExportJSON = () => {
    const data = {
      period: `${months[selectedMonth - 1]} ${selectedYear}`,
      monthlySummary: report,
      categoryDistribution: breakdown,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded successfully!', 'success');
  };

  const savingsRate = report?.savingsRatePercentage || 0;
  const balance = report?.balance || 0;

  return (
    <div className="view-content">
      {/* Top Header & Export Action */}
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

        <button className="btn btn-secondary" onClick={handleExportJSON}>
          <Download size={16} />
          <span>Export Summary (JSON)</span>
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card empty-state">
          <Loader2 size={36} className="spin-icon" color="var(--accent-primary)" />
          <p>Compiling financial intelligence...</p>
        </div>
      ) : (
        <>
          {/* Stat KPI Grid */}
          <div className="stat-grid">
            <StatCard
              label="Total Income"
              value={formatCurrency(report?.totalIncome || 0)}
              icon={TrendingUp}
              iconColor="var(--income-green)"
              iconBg="var(--income-bg)"
              meta={`${report?.incomeCount || 0} income streams`}
              glowBorderColor="var(--income-border)"
            />
            <StatCard
              label="Total Expenses"
              value={formatCurrency(report?.totalExpenses || 0)}
              icon={TrendingDown}
              iconColor="var(--expense-rose)"
              iconBg="var(--expense-bg)"
              meta={`${report?.expenseCount || 0} expense transactions`}
              glowBorderColor="var(--expense-border)"
            />
            <StatCard
              label="Net Cash Flow"
              value={formatCurrency(balance)}
              icon={PiggyBank}
              iconColor="#8b5cf6"
              iconBg="rgba(139, 92, 246, 0.15)"
              trend={{
                text: balance >= 0 ? 'Net Positive' : 'Net Negative',
                isPositive: balance >= 0,
              }}
              glowBorderColor="rgba(139, 92, 246, 0.35)"
            />
            <StatCard
              label="Savings Ratio"
              value={`${savingsRate.toFixed(1)}%`}
              icon={ShieldCheck}
              iconColor="var(--accent-secondary)"
              iconBg="var(--info-bg)"
              meta={savingsRate >= 20 ? 'Optimal (Target: >20%)' : 'Caution (Below 20%)'}
              glowBorderColor="rgba(6, 182, 212, 0.35)"
            />
          </div>

          {/* Detailed Category Distribution */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <PieChart size={18} />
                Expense Distribution by Category
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {breakdown.length} active spending categories
              </span>
            </div>

            {breakdown.length === 0 ? (
              <div className="empty-state">
                <p>No expense data recorded for {months[selectedMonth - 1]} {selectedYear}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {breakdown.map((item) => (
                  <div key={item.categoryId} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="category-badge-chip">
                        <span className="color-dot" style={{ background: item.color || '#6366f1' }} />
                        <span style={{ fontWeight: 600 }}>{item.categoryName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({item.count} {item.count === 1 ? 'transaction' : 'transactions'})
                        </span>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {formatCurrency(item.totalAmount)}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            marginLeft: '0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="progress-track" style={{ height: '10px' }}>
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
        </>
      )}
    </div>
  );
};
