export default function Select({ label, id, options = [], placeholder = "Select", className = "", ...props }) {
  const selectId = id || props.name;

  return (
    <label className={`field ${className}`.trim()} htmlFor={selectId}>
      {label && <span>{label}</span>}
      <select id={selectId} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}
