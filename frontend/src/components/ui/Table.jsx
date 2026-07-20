export default function Table({ children, className = "" }) {
  return (
    <div className={`table-shell ${className}`.trim()}>
      <table>{children}</table>
    </div>
  );
}
