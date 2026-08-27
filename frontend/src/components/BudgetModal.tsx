import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Category, Budget } from '../types';
import { Loader2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Budget | null;
  selectedYear: number;
  selectedMonth: number;
  onSubmit: (data: { categoryId: string; year: number; month: number; amount: number }) => Promise<void>;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  selectedYear,
  selectedMonth,
  onSubmit,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setCategoryId(initialData.categoryId);
        setAmount(String(initialData.amount));
      } else {
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setAmount('');
      }
    }
  }, [isOpen, initialData, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid budget amount greater than 0');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        categoryId,
        year: selectedYear,
        month: selectedMonth,
        amount: parsedAmount,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget target');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Category Budget' : 'Set Category Budget Limit'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* Category Selector */}
          <div className="form-group">
            <label className="form-label">Expense Category</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!initialData}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Limit Amount */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Monthly Spending Limit</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="e.g. 350.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              FinFlow will notify you when expenditures approach 80% and 100% of this limit.
            </span>
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
              <span>{initialData ? 'Update Budget' : 'Save Budget Target'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
