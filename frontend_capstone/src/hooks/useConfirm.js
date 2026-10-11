import { useState } from 'react';

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolveCallback, setResolveCallback] = useState(null);

  const confirm = ({ title, message, confirmText, cancelText, danger }) => {
    setConfig({ title, message, confirmText, cancelText, danger });
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true);
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    if (resolveCallback) {
      resolveCallback(false);
    }
    setIsOpen(false);
  };

  return {
    confirm,
    isOpen,
    config,
    handleConfirm,
    handleClose,
  };
}
