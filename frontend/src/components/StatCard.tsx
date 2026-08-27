import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  meta?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  glowBorderColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor = '#6366f1',
  iconBg = 'rgba(99, 102, 241, 0.15)',
  meta,
  trend,
  glowBorderColor,
}) => {
  return (
    <div
      className="glass-card stat-card"
      style={glowBorderColor ? { borderColor: glowBorderColor } : undefined}
    >
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div
          className="stat-icon-wrapper"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={22} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {(meta || trend) && (
        <div className="stat-meta">
          {trend && (
            <span
              style={{
                color: trend.isPositive === true ? 'var(--income-green)' : trend.isPositive === false ? 'var(--expense-rose)' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {trend.text}
            </span>
          )}
          {meta && <span>{meta}</span>}
        </div>
      )}
    </div>
  );
};
