import React, { useState } from 'react';
import { Plus, Tag, Edit2, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Category } from '../types';
import { CategoryModal } from '../components/CategoryModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface CategoriesViewProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onRefreshCategories,
}) => {
  const { showToast } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleCreateOrUpdate = async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => {
    if (editingCategory) {
      await api.updateCategory(editingCategory.id, data);
      showToast('Category updated successfully!', 'success');
    } else {
      await api.createCategory(data);
      showToast('New category created!', 'success');
    }
    onRefreshCategories();
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await api.deleteCategory(deletingCategory.id);
      showToast('Category removed successfully', 'info');
      onRefreshCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const systemCategories = categories.filter((c) => !c.userId);
  const userCategories = categories.filter((c) => !!c.userId);

  return (
    <div className="view-content">
      {/* Header Actions */}
      <div className="filter-toolbar">
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Expense Categories ({categories.length})</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Categorize transactions to unlock deep spending analytics
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>New Category</span>
        </button>
      </div>

      {/* User Custom Categories */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          Your Custom Categories ({userCategories.length})
        </h3>

        {userCategories.length === 0 ? (
          <div className="glass-card empty-state" style={{ padding: '2rem' }}>
            <p>You haven't created any custom categories yet.</p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Create Custom Category
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {userCategories.map((cat) => (
              <div key={cat.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        background: cat.color || 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: `0 0 14px ${cat.color}66`,
                      }}
                    >
                      <Tag size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{cat.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Custom Category
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      title="Edit Category"
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ width: '32px', height: '32px', color: 'var(--expense-rose)' }}
                      title="Delete Category"
                      onClick={() => setDeletingCategory(cat)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {cat.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Default Categories */}
      <div>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={16} color="var(--income-green)" />
          Standard System Categories ({systemCategories.length})
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {systemCategories.map((cat) => (
            <div key={cat.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: cat.color || '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 0 12px ${cat.color || '#64748b'}44`,
                  }}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{cat.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    System Default
                  </span>
                </div>
              </div>
              {cat.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {cat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCategory}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Custom Category"
        message={`Are you sure you want to delete the category "${deletingCategory?.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
