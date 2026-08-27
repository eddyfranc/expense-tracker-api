import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Clock,
  Flame,
  CheckCircle2,
  Loader2,
  Repeat,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Subscription, SubscriptionSummary, Category } from '../types';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { StatCard } from '../components/StatCard';

interface SubscriptionsViewProps {
  categories: Category[];
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ categories }) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useNotification();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary>({
    totalActive: 0,
    estimatedMonthlyBurn: 0,
    upcomingIn7Days: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getSubscriptions(filterStatus || undefined);
      if (res.success && res.data) {
        setSubscriptions(res.data.subscriptions || []);
        setSummary(res.data.summary || { totalActive: 0, estimatedMonthlyBurn: 0, upcomingIn7Days: 0 });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load subscriptions', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, showToast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCreateOrUpdate = async (data: {
    name: string;
    categoryId: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    nextBillingDate: string;
    status?: 'active' | 'paused' | 'cancelled';
    description?: string;
  }) => {
    if (editingSub) {
      await api.updateSubscription(editingSub.id, data);
      showToast('Subscription updated successfully!', 'success');
    } else {
      await api.createSubscription(data);
      showToast('Recurring subscription added!', 'success');
    }
    fetchSubscriptions();
  };

  const handleToggleStatus = async (sub: Subscription) => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateSubscription(sub.id, { status: nextStatus });
      showToast(`Subscription ${nextStatus === 'active' ? 'activated' : 'paused'}`, 'info');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingSub) return;
    try {
      await api.deleteSubscription(deletingSub.id);
      showToast('Subscription removed', 'info');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete subscription', 'error');
    }
  };

  return (
    <div className="view-content">
      {/* Top Filter & Actions Bar */}
      <div className="filter-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingSub(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid">
        <StatCard
          label="Monthly Recurring Burn"
          value={formatCurrency(summary.estimatedMonthlyBurn)}
          icon={Flame}
          iconColor="var(--expense-rose)"
          iconBg="var(--expense-bg)"
          meta="Estimated fixed monthly commitment"
          glowBorderColor="var(--expense-border)"
        />
        <StatCard
          label="Active Subscriptions"
          value={`${summary.totalActive} Services`}
          icon={CheckCircle2}
          iconColor="var(--income-green)"
          iconBg="var(--income-bg)"
          meta={`${subscriptions.length} total tracked subscriptions`}
          glowBorderColor="var(--income-border)"
        />
        <StatCard
          label="Upcoming Bills (7 Days)"
          value={`${summary.upcomingIn7Days} Renewals`}
          icon={Clock}
          iconColor="var(--warning-amber)"
          iconBg="var(--warning-bg)"
          meta={summary.upcomingIn7Days > 0 ? 'Bills due within this week' : 'No renewals due this week'}
          glowBorderColor="rgba(245, 158, 11, 0.35)"
        />
      </div>

      {/* Subscriptions Table / Cards */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">
            <Repeat size={18} />
            Tracked Recurring Subscriptions & Fixed Bills
          </h3>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" color="var(--accent-primary)" />
            <p>Loading your subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CalendarClock size={28} />
            </div>
            <p>No recurring subscriptions found.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingSub(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Track First Subscription
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Category</th>
                  <th>Billing Cycle</th>
                  <th>Next Billing Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const renewalDate = new Date(sub.nextBillingDate);
                  const isUpcoming =
                    sub.status === 'active' &&
                    renewalDate.getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000 &&
                    renewalDate.getTime() >= new Date().getTime();

                  return (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700 }}>{sub.name}</span>
                          {sub.description && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sub.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="category-pill">
                          <span className="color-dot" style={{ background: sub.categoryColor || '#6366f1' }} />
                          {sub.categoryName}
                        </span>
                      </td>
                      <td>
                        <span
                          className="category-pill"
                          style={{
                            textTransform: 'capitalize',
                            background: 'var(--bg-surface)',
                          }}
                        >
                          {sub.billingCycle}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {renewalDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {isUpcoming && (
                            <span
                              className="category-pill"
                              style={{
                                background: 'var(--warning-bg)',
                                color: 'var(--warning-amber)',
                                borderColor: 'rgba(245,158,11,0.4)',
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                              }}
                            >
                              Due Soon
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className="category-pill"
                          style={{
                            background: sub.status === 'active' ? 'var(--income-bg)' : 'rgba(255,255,255,0.05)',
                            color: sub.status === 'active' ? 'var(--income-green)' : 'var(--text-muted)',
                            borderColor: sub.status === 'active' ? 'var(--income-border)' : 'var(--border-subtle)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="amount-expense">
                          {formatCurrency(sub.amount)}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>
                            /{sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'mo'}
                          </span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ width: '30px', height: '30px' }}
                            title={sub.status === 'active' ? 'Pause Subscription' : 'Activate Subscription'}
                            onClick={() => handleToggleStatus(sub)}
                          >
                            {sub.status === 'active' ? <Pause size={14} /> : <Play size={14} color="var(--income-green)" />}
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ width: '30px', height: '30px' }}
                            title="Edit Subscription"
                            onClick={() => {
                              setEditingSub(sub);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ width: '30px', height: '30px', color: 'var(--expense-rose)' }}
                            title="Delete Subscription"
                            onClick={() => setDeletingSub(sub)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Modal (Add/Edit) */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        initialData={editingSub}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        title="Delete Subscription"
        message={`Are you sure you want to stop tracking "${deletingSub?.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
