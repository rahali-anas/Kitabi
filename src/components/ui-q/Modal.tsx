import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="q-modal-backdrop" onClick={onClose}>
      <div
        className="q-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="q-modal-head">
          <h2 className="q-modal-title">{title}</h2>
          <button className="q-modal-close" onClick={onClose} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="q-modal-body">{children}</div>

        {footer && <div className="q-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="q-field">
      <label className="q-field-label">{label}</label>
      {children}
      {hint && <p className="q-field-hint">{hint}</p>}
    </div>
  );
}

export function ChipInput({
  values,
  onChange,
  placeholder,
  lowercase,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  lowercase?: boolean;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = lowercase ? input.trim().toLowerCase() : input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput('');
  };
  return (
    <>
      <div className="q-chip-input-row">
        <input
          className="q-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button type="button" className="q-btn" onClick={add}>
          + Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="q-chips">
          {values.map((v, i) => (
            <span key={i} className="q-chip">
              {v}
              <button
                type="button"
                className="q-chip-x"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}