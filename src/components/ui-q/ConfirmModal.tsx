import { Modal } from './Modal';

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth={400}
      footer={
        <>
          <button className="q-btn q-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="q-btn q-btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}