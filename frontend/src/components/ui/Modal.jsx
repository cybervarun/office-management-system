import { FiX } from "react-icons/fi";
import Button from "./Button";

export default function Modal({ children, open, title, onClose, footer }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="modal-panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <Button aria-label="Close modal" icon={FiX} onClick={onClose} size="icon" variant="ghost">
            Close
          </Button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}
