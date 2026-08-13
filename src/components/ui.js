'use client';

export function StatCard({ label, value, change, changeType = 'neutral', icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
        </div>
        {icon && (
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 8, 
            background: 'var(--n-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--n-500)'
          }}>
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className={`stat-card-change ${changeType}`}>
          {changeType === 'positive' && '↑'}
          {changeType === 'negative' && '↓'}
          {change}
        </div>
      )}
    </div>
  );
}

export function Card({ title, children, action, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'neutral' }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'primary', size = 'md', disabled, onClick, className = '', ...props }) {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 13 },
    md: { padding: '10px 16px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 16 },
  };

  return (
    <button
      className={`btn btn-${variant} ${className}`}
      style={sizeStyles[size]}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function LoadingSpinner() {
  return <div className="loading-spinner" />;
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {text && <p className="empty-state-text">{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
