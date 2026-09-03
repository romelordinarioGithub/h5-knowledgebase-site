import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'md' | 'lg';
  className?: string;
  panelClassName?: string;
};

/**
 * Accessible modal with focus trap + restore (Headless UI Dialog).
 * Esc closes; Tab cycles within the panel.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  size = 'md',
  className,
  panelClassName,
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className={cn('relative z-[100]', className)}>
      <div className="fixed inset-0 bg-[rgba(23,18,44,0.56)]" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={cn(
              'relative w-full bg-surface shadow-card',
              size === 'lg' ? 'max-w-[min(1100px,94vw)] rounded-[22px]' : 'max-w-[min(600px,92vw)] rounded-[18px]',
              panelClassName
            )}
          >
            {title ? (
              <DialogTitle className="sr-only">{title}</DialogTitle>
            ) : null}
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

type ModalCloseProps = {
  onClick: () => void;
  label?: string;
};

export function ModalClose({ onClick, label = 'Close' }: ModalCloseProps) {
  return (
    <button
      type="button"
      className="modal-close"
      aria-label={label}
      onClick={onClick}
    />
  );
}
