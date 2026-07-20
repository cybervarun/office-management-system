import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import FormInput from "./FormInput";

export default function AddDropdownItemModal({ open, fieldLabel, onClose, onSave }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      setValue("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title={`Add New ${fieldLabel}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-dropdown-form">
            Add
          </Button>
        </>
      }
    >
      <form
        id="add-dropdown-form"
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = value.trim();
          if (trimmed) {
            onSave(trimmed);
          }
        }}
      >
        <FormInput
          label={`${fieldLabel} name`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type="text"
          placeholder={`Enter ${fieldLabel}`}
        />
      </form>
    </Modal>
  );
}
