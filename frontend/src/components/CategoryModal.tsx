import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Category } from '../types';
import { Loader2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
  onSubmit: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>('#6366f1');
  const [icon, setIcon] = useState<string>('tag');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const colorPresets = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
  ];

  const iconPresets = [
    'tag', 'shopping-cart', 'utensils', 'home', 'car', 'coffee',
    'heart-pulse', 'film', 'plane', 'zap', 'briefcase', 'book-open',
    'gift', 'smartphone', 'smile', 'shield'
  ];

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setColor(initialData.color || '#6366f1');
        setIcon(initialData.icon || 'tag');
      } else {
        setName('');
        setDescription('');
        setColor('#6366f1');
        setIcon('tag');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        icon: icon || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Category' : 'Create Custom Category'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Streaming Services, Groceries..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brief summary of expenses in this category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Color Palette Selector */}
          <div className="form-group">
            <label className="form-label">Category Color</label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {colorPresets.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #ffffff' : '2px solid transparent',
                    boxShadow: color === c ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'none',
                  cursor: 'pointer',
                }}
                title="Custom color"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Icon Keyword</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {iconPresets.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`btn btn-secondary ${icon === ic ? 'btn-primary' : ''}`}
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                >
                  {ic}
                </button>
              ))}
            </div>
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
              <span>{initialData ? 'Update Category' : 'Create Category'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
