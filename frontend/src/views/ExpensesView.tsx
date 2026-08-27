import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Expense, Category, PaginationMeta } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { CsvImportModal } from '../components/CsvImportModal';
import { exportExpensesToCsv } from '../utils/csv';

interface ExpensesViewProps {
  categories: Category[];
  onRefreshData?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  categories,
  onRefreshData,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useNotification();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('expenseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getExpenses({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success) {
        setExpenses(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedCategory, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateOrUpdate = async (data: {
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate: string;
  }) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, data);
      showToast('Expense updated successfully!', 'success');
    } else {
      await api.createExpense(data);
      showToast('Expense added successfully!', 'success');
    }
    fetchExpenses();
    if (onRefreshData) onRefreshData();
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await api.deleteExpense(deletingExpense.id);
      showToast('Expense deleted successfully', 'info');
      fetchExpenses();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const handleExportCsv = () => {
    if (expenses.length === 0) {
      showToast('No expense records available to export', 'info');
      return;
    }
    exportExpensesToCsv(expenses, `finflow-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${expenses.length} expenses to CSV!`, 'success');
  };

  return (
    <div className="view-content">
      {/* Top Filter & Actions Bar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ minWidth: '160px' }}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Order Selector */}
          <select
            className="form-select"
            style={{ minWidth: '150px' }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so as 'asc' | 'desc');
            }}
          >
            <option value="expenseDate-desc">Date (Newest First)</option>
            <option value="expenseDate-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (Highest First)</option>
            <option value="amount-asc">Amount (Lowest First)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv} title="Export to CSV file">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsCsvModalOpen(true)} title="Import from CSV statement">
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
          <button
            className="btn btn-expense"
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="glass-card">
        {isLoading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" color="var(--expense-rose)" />
            <p>Loading your expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses match your filters.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-expense"
                onClick={() => {
                  setEditingExpense(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={16} /> Add First Expense
              </button>
              <button className="btn btn-secondary" onClick={() => setIsCsvModalOpen(true)}>
                <Upload size={16} /> Import from CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <span className="category-pill">
                        <span
                          className="color-dot"
                          style={{ background: expense.category?.color || '#f43f5e' }}
                        />
                        {expense.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {expense.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(expense.expenseDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="amount-expense">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          title="Edit Expense"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px', color: 'var(--expense-rose)' }}
                          title="Delete Expense"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {expenses.length} of {pagination.totalItems} entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-icon"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-icon"
                disabled={!pagination.hasNextPage}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="expense"
        categories={categories}
        initialData={editingExpense}
        onSubmitExpense={handleCreateOrUpdate}
      />

      {/* CSV Statement Importer Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        mode="expense"
        categories={categories}
        onImportComplete={() => {
          showToast('CSV statement imported successfully!', 'success');
          fetchExpenses();
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        title="Delete Expense"
        message={`Are you sure you want to permanently delete this expense of ${deletingExpense ? formatCurrency(deletingExpense.amount) : ''}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
