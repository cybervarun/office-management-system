export default function FormInput({ label, id, className = "", ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label && <span>{label}</span>}
      <input id={inputId} {...props} />
    </label>
  );
}
