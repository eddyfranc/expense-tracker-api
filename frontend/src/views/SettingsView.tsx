import React, { useState, useEffect } from 'react';
import { User, DollarSign, Activity, ExternalLink, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

export const SettingsView: React.FC = () => {
  const { user, currency, setCurrency, refreshUser } = useAuth();
  const { showToast } = useNotification();

  const [firstName, setFirstName] = useState<string>(user?.firstName || '');
  const [lastName, setLastName] = useState<string>(user?.lastName || '');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [healthStatus, setHealthStatus] = useState<{
    success: boolean;
    status: string;
    database: string;
    version: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  const currencies = [
    { symbol: '$', name: 'US Dollar (USD)' },
    { symbol: '€', name: 'Euro (EUR)' },
    { symbol: '£', name: 'British Pound (GBP)' },
    { symbol: 'KSh ', name: 'Kenyan Shilling (KES)' },
    { symbol: '¥', name: 'Japanese Yen (JPY)' },
    { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
    { symbol: 'A$', name: 'Australian Dollar (AUD)' },
    { symbol: '₹', name: 'Indian Rupee (INR)' },
    { symbol: 'CHF ', name: 'Swiss Franc (CHF)' },
  ];

  const handleCheckHealth = async () => {
    try {
      setIsCheckingHealth(true);
      const res = await api.getHealth();
      setHealthStatus(res);
      showToast('API is healthy and operational!', 'success');
    } catch {
      showToast('API connection error', 'error');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    handleCheckHealth();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First and last name cannot be blank', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      await api.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      showToast('Profile information updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="view-content" style={{ maxWidth: '800px' }}>
      {/* Profile Card */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <User size={18} />
            User Profile Information
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Your email is used as your unique login identifier.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Currency Preference Card */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <DollarSign size={18} />
            Currency & Display Preferences
          </h3>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Preferred Currency Symbol</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            {currencies.map((c) => (
              <button
                type="button"
                key={c.symbol}
                className={`btn ${currency === c.symbol ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setCurrency(c.symbol);
                  showToast(`Currency updated to ${c.name}`, 'info');
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '1rem', width: '28px' }}>{c.symbol}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Health & Developer Swagger Card */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={18} />
            Backend API & Service Health
          </h3>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={handleCheckHealth} disabled={isCheckingHealth}>
            {isCheckingHealth ? <Loader2 size={14} className="spin-icon" /> : 'Recheck'}
          </button>
        </div>

        {healthStatus && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</span>
              <span className="category-pill" style={{ background: 'var(--income-bg)', color: 'var(--income-green)', borderColor: 'var(--income-border)' }}>
                <CheckCircle2 size={14} /> {healthStatus.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>PostgreSQL Database</span>
              <span style={{ fontWeight: 600, color: 'var(--income-green)' }}>{healthStatus.database}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>API Version</span>
              <span style={{ fontWeight: 600 }}>v{healthStatus.version}</span>
            </div>
          </div>
        )}

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>OpenAPI / Swagger Documentation</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Explore interactive API endpoints, schemas, and test tools
            </p>
          </div>
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <span>Open Swagger</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
