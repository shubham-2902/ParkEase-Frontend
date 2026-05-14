import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmDialog — reusable confirmation modal
 *
 * Props:
 *  isOpen       → boolean
 *  onClose      → cancel handler
 *  onConfirm    → confirm handler
 *  title        → dialog title
 *  message      → dialog message
 *  confirmLabel → confirm button text
 *  confirmVariant → button variant (danger | primary)
 *  loading      → shows spinner on confirm button
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title          = 'Are you sure?',
  message        = 'This action cannot be undone.',
  confirmLabel   = 'Confirm',
  confirmVariant = 'danger',
  loading        = false,
}) => {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-14 h-14 rounded-full bg-red-50
                        flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;