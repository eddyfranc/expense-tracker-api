import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Income, Category, PaginationMeta } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { CsvImportModal } from '../components/CsvImportModal';
import { exportIncomeToCsv } from '../utils/csv';

interface IncomeViewProps {
  categories: Category[];
  onRefreshData?: () => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  categories,
  onRefreshData,
}) => {
  const { formatCurrency } = useAuth();
  const { showToast } = useNotification();

  const [incomeList, setIncomeList] = useState<Income[]>([]);
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
  const [sortBy, setSortBy] = useState<string>('incomeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  const fetchIncome = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getIncome({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success) {
        setIncomeList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load income records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const handleCreateOrUpdate = async (data: {
    amount: number;
    source: string;
    description?: string;
    incomeDate: string;
  }) => {
    if (editingIncome) {
      await api.updateIncome(editingIncome.id, data);
      showToast('Income updated successfully!', 'success');
    } else {
      await api.createIncome(data);
      showToast('Income recorded successfully!', 'success');
    }
    fetchIncome();
    if (onRefreshData) onRefreshData();
  };

  const handleDelete = async () => {
    if (!deletingIncome) return;
    try {
      await api.deleteIncome(deletingIncome.id);
      showToast('Income record deleted successfully', 'info');
      fetchIncome();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete income record', 'error');
    }
  };

  const handleExportCsv = () => {
    if (incomeList.length === 0) {
      showToast('No income records available to export', 'info');
      return;
    }
    exportIncomeToCsv(incomeList, `finflow-income-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${incomeList.length} income entries to CSV!`, 'success');
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
              placeholder="Search income source / notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

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
            <option value="incomeDate-desc">Date (Newest First)</option>
            <option value="incomeDate-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (Highest First)</option>
            <option value="amount-asc">Amount (Lowest First)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv} title="Export to CSV">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsCsvModalOpen(true)} title="Import from CSV">
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
          <button
            className="btn btn-income"
            onClick={() => {
              setEditingIncome(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Main Income Table */}
      <div className="glass-card">
        {isLoading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" color="var(--income-green)" />
            <p>Loading your income records...</p>
          </div>
        ) : incomeList.length === 0 ? (
          <div className="empty-state">
            <p>No income records match your filters.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-income"
                onClick={() => {
                  setEditingIncome(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={16} /> Record First Income
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
                  <th>Source</th>
                  <th>Notes / Description</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomeList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        className="category-pill"
                        style={{
                          background: 'var(--income-bg)',
                          color: 'var(--income-green)',
                          borderColor: 'var(--income-border)',
                        }}
                      >
                        <TrendingUp size={14} />
                        {item.source}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {item.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(item.incomeDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="amount-income">
                        +{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          title="Edit Income"
                          onClick={() => {
                            setEditingIncome(item);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px', color: 'var(--expense-rose)' }}
                          title="Delete Income"
                          onClick={() => setDeletingIncome(item)}
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
              Showing {incomeList.length} of {pagination.totalItems} entries
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
        mode="income"
        categories={categories}
        initialData={editingIncome}
        onSubmitIncome={handleCreateOrUpdate}
      />

      {/* CSV Statement Importer Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        mode="income"
        categories={categories}
        onImportComplete={() => {
          showToast('Income statement imported successfully!', 'success');
          fetchIncome();
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingIncome}
        onClose={() => setDeletingIncome(null)}
        title="Delete Income Record"
        message={`Are you sure you want to permanently delete this income entry of ${deletingIncome ? formatCurrency(deletingIncome.amount) : ''}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
