export default function Button({
  children,
  className = "",
  icon: Icon,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`.trim()} type={type} {...props}>
      {Icon && <Icon aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
