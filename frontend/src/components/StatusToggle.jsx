const OPTIONS = [
  { value: "ONLINE", label: "Online", dot: "var(--color-online)" },
  { value: "BUSY", label: "Busy", dot: "var(--color-busy)" },
  { value: "OFFLINE", label: "Offline", dot: "var(--color-offline)" },
];

export function StatusToggle({
  value,
  onChange,
  disabled,
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Consultant availability"
      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] p-1"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`focus-ring flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "bg-[var(--color-surface-3)] text-[var(--color-text)]"
                : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: opt.dot,
                boxShadow: active ? `0 0 0 3px ${opt.dot}22` : "none",
              }}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
