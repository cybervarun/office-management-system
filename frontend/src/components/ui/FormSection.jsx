/**
 * FormSection Component
 * Reusable section container for organizing form fields into logical groups
 */
export default function FormSection({ title, description, children, className = "" }) {
  return (
    <fieldset className={`form-section ${className}`.trim()}>
      {(title || description) && (
        <legend className="form-section-header">
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </legend>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </fieldset>
  );
}
