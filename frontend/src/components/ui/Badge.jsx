export default function Badge({ children, tone = "neutral", dot = true }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
