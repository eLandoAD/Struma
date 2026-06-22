const variantClasses = {
  primary:
    "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white disabled:opacity-50",
  secondary:
    "bg-[var(--color-surface-3)] hover:bg-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50",
  danger:
    "bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white disabled:opacity-50",
  ghost:
    "bg-transparent hover:bg-[var(--color-surface-2)] text-[var(--color-text-dim)]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
