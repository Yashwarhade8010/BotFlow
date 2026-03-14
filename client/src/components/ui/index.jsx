// ── Input ──────────────────────────────────────────
export function Input({ label, icon, error, className = '', ...props }) {
  return (
    <div className="mb-3 sm:mb-4">
      {label && <label className="label text-xs sm:text-sm">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-sm sm:text-base">
            {icon}
          </span>
        )}
        <input
          className={`input text-sm sm:text-base ${
            icon ? "pl-9 sm:pl-10" : ""
          } ${error ? "border-red" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Button ─────────────────────────────────────────
export function Button({ variant = 'primary', loading, children, className = '', ...props }) {
  const base = 'btn-' + variant;
  return (
    <button
      className={`${base} text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2 justify-center">
          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ── Card ───────────────────────────────────────────
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────
export function Toggle({ checked, onChange }) {
  return (
    <div
      className={`toggle ${checked ? "on" : ""} scale-90 sm:scale-100`}
      onClick={() => onChange?.(!checked)}
    />
  );
}

// ── Badge ──────────────────────────────────────────
export function BotStatusBadge({ status }) {
  const map = {
    active: "badge-live",
    paused: "badge-paused",
    draft: "badge-draft",
    error: "badge-paused",
  };
  const label = {
    active: "Live",
    paused: "Paused",
    draft: "Draft",
    error: "Error",
  };
  return (
    <span className={`text-xs sm:text-sm ${map[status] || "badge-draft"}`}>
      {label[status] || status}
    </span>
  );
}

export function ConvStatusBadge({ status }) {
  const map = {
    active: "status-active",
    resolved: "status-resolved",
    escalated: "status-escalated",
    abandoned: "status-abandoned",
  };
  const label = {
    active: "● Active",
    resolved: "✓ Resolved",
    escalated: "⚡ Escalated",
    abandoned: "Abandoned",
  };
  return (
    <span
      className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
        map[status] || ""
      }`}
    >
      {label[status] || status}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────
// On mobile  → slides up from bottom, full-width, rounded top corners
// On sm+     → centered card, max-w-lg, rounded corners all around
export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card p-5 sm:p-8 w-full sm:max-w-lg rounded-b-none sm:rounded-2xl animate-fadeUp max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold font-syne text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-text text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────
export function KPICard({ label, value, change, icon, color = 'green' }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-base sm:text-lg">{icon}</span>
        <span className="text-[10px] sm:text-xs font-semibold text-muted2 uppercase tracking-widest font-syne">
          {label}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-bold font-syne text-white mb-1">
        {value ?? "—"}
      </div>
      {change && <div className="text-xs text-muted2">{change}</div>}
    </div>
  );
}

// ── Empty State ────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-10 sm:py-16 px-4 sm:px-6">
      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{icon}</div>
      <h3 className="font-syne font-bold text-white text-base sm:text-lg mb-2">
        {title}
      </h3>
      <p className="text-muted2 text-xs sm:text-sm mb-5 sm:mb-6 max-w-xs mx-auto">
        {description}
      </p>
      {action}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return <div className={`${s} border-2 border-green border-t-transparent rounded-full animate-spin`} />;
}

// ── Auth Layout ────────────────────────────────────
export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 sm:p-6">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-green/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,106,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,106,.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-fadeUp">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 justify-center font-syne font-extrabold text-lg sm:text-xl text-white no-underline mb-7 sm:mb-9"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green rounded-full flex items-center justify-center text-sm sm:text-base">
            💬
          </div>
          BotFlow
        </a>

        {children}
      </div>
    </div>
  );
}