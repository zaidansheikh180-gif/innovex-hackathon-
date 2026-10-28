/**
 * @file ConfirmModal.tsx
 * Accessible modal dialog with focus management and keyboard handling (Esc to close).
 * Returns focus to the trigger element when dismissed.
 */

import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isProcessing?: boolean;
  triggerElementRef?: React.RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isDestructive = false,
  isProcessing = false,
  triggerElementRef,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when opened
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isProcessing) {
          e.preventDefault();
          onCancel();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Return focus to trigger element
        triggerElementRef?.current?.focus();
      };
    }
  }, [isOpen, onCancel, isProcessing, triggerElementRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-300 p-6 space-y-4 text-slate-900 focus:outline-hidden"
      >
        <h2 id="confirm-modal-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        <div className="text-sm text-slate-700 leading-relaxed">{message}</div>

        <div className="flex flex-col sm:flex-row-reverse sm:justify-end gap-3 pt-3">
          <button
            ref={confirmButtonRef}
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2.5 rounded font-medium text-sm text-white transition-colors focus:ring-2 focus:ring-offset-2 ${
              isDestructive
                ? 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-600'
                : 'bg-teal-700 hover:bg-teal-800 focus:ring-teal-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
