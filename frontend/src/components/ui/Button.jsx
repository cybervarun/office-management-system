export default function Button({
  children,
  className = "",
  icon: Icon,
  variant = "primary",
  size = "md",
  type = "button",
  danger = false,
  ...props
}) {
  const baseClass = `btn btn-${variant}`;
  const sizeClass = size !== "md" ? ` btn-${size}` : "";
  const dangerClass = danger ? " danger-ghost" : "";
  const iconEl = Icon ? <Icon aria-hidden="true" /> : null;
  const hasIcon = !!Icon;
  const iconOnly = hasIcon && !children;

  return (
    <button
      className={`${baseClass}${sizeClass}${dangerClass}${iconOnly ? ' btn-icon' : ''} ${className}`.trim()}
      type={type}
      {...props}
    >
      {iconEl}
      {children && <span>{children}</span>}
    </button>
  );
}
