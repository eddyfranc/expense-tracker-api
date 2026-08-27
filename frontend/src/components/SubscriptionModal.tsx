import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Category, Subscription } from '../types';
import { Loader2 } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Subscription | null;
  onSubmit: (data: {
    name: string;
    categoryId: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    nextBillingDate: string;
    status?: 'active' | 'paused' | 'cancelled';
    description?: string;
  }) => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setName(initialData.name);
        setCategoryId(initialData.categoryId);
        setAmount(String(initialData.amount));
        setBillingCycle(initialData.billingCycle);
        const d = new Date(initialData.nextBillingDate);
        setNextBillingDate(d.toISOString().slice(0, 10));
        setStatus(initialData.status);
        setDescription(initialData.description || '');
      } else {
        setName('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setAmount('');
        setBillingCycle('monthly');
        const now = new Date();
        setNextBillingDate(now.toISOString().slice(0, 10));
        setStatus('active');
        setDescription('');
      }
    }
  }, [isOpen, initialData, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!name.trim()) {
      setError('Subscription name is required');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    if (!nextBillingDate) {
      setError('Please choose the next billing renewal date');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        categoryId,
        amount: parsedAmount,
        billingCycle,
        nextBillingDate: new Date(nextBillingDate).toISOString(),
        status,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Subscription' : 'Add Recurring Subscription / Bill'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Service / Subscription Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Netflix, Spotify, AWS, Gym..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Billing Cycle */}
            <div className="form-group">
              <label className="form-label">Billing Frequency</label>
              <select
                className="form-select"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Next Billing Date */}
          <div className="form-group">
            <label className="form-label">Next Renewal / Billing Date</label>
            <input
              type="date"
              className="form-input"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shared family plan, 4 screens"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{initialData ? 'Update Subscription' : 'Track Subscription'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
