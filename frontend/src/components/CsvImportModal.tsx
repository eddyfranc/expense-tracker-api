import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { parseCsv } from '../utils/csv';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import type { Category } from '../types';
import { api } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'expense' | 'income';
  categories: Category[];
  onImportComplete: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  mode,
  categories,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [dateField, setDateField] = useState<string>('');
  const [descField, setDescField] = useState<string>('');
  const [amountField, setAmountField] = useState<string>('');
  const [categoryField, setCategoryField] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState<string>(categories[0]?.id || '');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError('The CSV file is empty or could not be parsed.');
          return;
        }

        setHeaders(parsed.headers);
        setRows(parsed.rows);

        // Auto-detect columns
        parsed.headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (lower.includes('date') || lower.includes('time')) setDateField(h);
          if (lower.includes('desc') || lower.includes('memo') || lower.includes('name') || lower.includes('title')) setDescField(h);
          if (lower.includes('amount') || lower.includes('price') || lower.includes('cost') || lower.includes('total')) setAmountField(h);
          if (lower.includes('cat') || lower.includes('tag') || lower.includes('type')) setCategoryField(h);
        });
      } catch (err: any) {
        setError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    if (!dateField || !amountField) {
      setError('Please map both Date and Amount columns');
      return;
    }

    setIsImporting(true);
    setError('');
    setImportProgress({ current: 0, total: rows.length });

    let importedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawDate = row[dateField];
      const rawAmount = row[amountField];
      const rawDesc = descField ? row[descField] : '';

      const parsedAmount = Math.abs(parseFloat(rawAmount?.replace(/[^0-9.-]+/g, '') || '0'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        failedCount++;
        continue;
      }

      let parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      try {
        if (mode === 'expense') {
          // Category matching or default fallback
          let matchedCatId = defaultCategory;
          if (categoryField && row[categoryField]) {
            const rawCatName = row[categoryField].toLowerCase();
            const matched = categories.find((c) => c.name.toLowerCase().includes(rawCatName));
            if (matched) matchedCatId = matched.id;
          }

          await api.createExpense({
            amount: parsedAmount,
            categoryId: matchedCatId,
            description: rawDesc || 'Imported expense',
            expenseDate: parsedDate.toISOString(),
          });
        } else {
          await api.createIncome({
            amount: parsedAmount,
            source: rawDesc || 'Imported income',
            description: `Imported from ${fileName}`,
            incomeDate: parsedDate.toISOString(),
          });
        }
        importedCount++;
      } catch {
        failedCount++;
      }

      setImportProgress({ current: i + 1, total: rows.length });
    }

    setIsImporting(false);
    onImportComplete();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import ${mode === 'expense' ? 'Expenses' : 'Income'} from CSV`}
      maxWidth="680px"
    >
      <div className="modal-body">
        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {/* Upload Drop Zone */}
        {rows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-hover)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-surface)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={28} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Choose a CSV Bank Statement file</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Supports standard bank, card, or accounting CSV statements
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600 }}>{fileName}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({rows.length} rows found)</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem' }}
                onClick={() => {
                  setRows([]);
                  setHeaders([]);
                  setFileName('');
                }}
              >
                Choose Another File
              </button>
            </div>

            {/* Column Mapping Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date Column *</label>
                <select
                  className="form-select"
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value)}
                  required
                >
                  <option value="">-- Select Date Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount Column *</label>
                <select
                  className="form-select"
                  value={amountField}
                  onChange={(e) => setAmountField(e.target.value)}
                  required
                >
                  <option value="">-- Select Amount Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description / Payee Column</label>
                <select
                  className="form-select"
                  value={descField}
                  onChange={(e) => setDescField(e.target.value)}
                >
                  <option value="">-- Select Description Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'expense' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fallback Category</label>
                  <select
                    className="form-select"
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live Data Preview */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Previewing First 4 Rows
              </h5>
              <div className="table-wrapper">
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 4).map((r, i) => (
                      <tr key={i}>
                        <td>{dateField ? r[dateField] : '-'}</td>
                        <td>{descField ? r[descField] : 'No description'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {amountField ? r[amountField] : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progress bar */}
            {isImporting && importProgress && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Importing transactions...</span>
                  <span style={{ fontWeight: 600 }}>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill savings"
                    style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isImporting}>
          Cancel
        </button>
        {rows.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartImport}
            disabled={isImporting || !dateField || !amountField}
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Importing ({importProgress?.current || 0}/{importProgress?.total || 0})...</span>
              </>
            ) : (
              <span>Import {rows.length} Transactions</span>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};
