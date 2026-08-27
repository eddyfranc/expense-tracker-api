import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Category, Expense, Income } from '../types';
import { Loader2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'expense' | 'income';
  categories: Category[];
  initialData?: Expense | Income | null;
  onSubmitExpense?: (data: { categoryId: string; amount: number; description?: string; expenseDate: string }) => Promise<void>;
  onSubmitIncome?: (data: { amount: number; source: string; description?: string; incomeDate: string }) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  mode,
  categories,
  initialData,
  onSubmitExpense,
  onSubmitIncome,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [source, setSource] = useState<string>('Salary');
  const [date, setDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const incomeSources = ['Salary', 'Freelance', 'Investments', 'Side Project', 'Bonus', 'Dividends', 'Gift', 'Other'];

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setAmount(String(initialData.amount));
        setDescription(initialData.description || '');
        if (mode === 'expense' && 'categoryId' in initialData) {
          setCategoryId(initialData.categoryId);
          const d = new Date(initialData.expenseDate);
          setDate(d.toISOString().slice(0, 16));
        } else if (mode === 'income' && 'source' in initialData) {
          setSource(initialData.source);
          const d = new Date(initialData.incomeDate);
          setDate(d.toISOString().slice(0, 16));
        }
      } else {
        setAmount('');
        setDescription('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setSource('Salary');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setDate(now.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, initialData, mode, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!date) {
      setError('Please select a valid date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      const isoDate = new Date(date).toISOString();

      if (mode === 'expense') {
        if (!categoryId) {
          setError('Please select a category');
          return;
        }
        if (onSubmitExpense) {
          await onSubmitExpense({
            amount: parsedAmount,
            categoryId,
            description: description.trim() || undefined,
            expenseDate: isoDate,
          });
        }
      } else {
        if (!source.trim()) {
          setError('Please specify an income source');
          return;
        }
        if (onSubmitIncome) {
          await onSubmitIncome({
            amount: parsedAmount,
            source: source.trim(),
            description: description.trim() || undefined,
            incomeDate: isoDate,
          });
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = initialData
    ? `Edit ${mode === 'expense' ? 'Expense' : 'Income'}`
    : `Add New ${mode === 'expense' ? 'Expense' : 'Income'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* Amount Field */}
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
              autoFocus
            />
          </div>

          {/* Mode specific fields */}
          {mode === 'expense' ? (
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Income Source</label>
              <select
                className="form-select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {incomeSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time Field */}
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Description Field */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description / Note (Optional)</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder="Add details about this transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className={`btn ${mode === 'expense' ? 'btn-expense' : 'btn-income'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{initialData ? 'Update' : 'Save'} {mode === 'expense' ? 'Expense' : 'Income'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
