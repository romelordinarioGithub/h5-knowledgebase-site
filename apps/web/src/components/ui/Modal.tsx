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
      <div
        className="fixed inset-0 bg-[rgba(25,27,35,0.45)] backdrop-blur-[3px]"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={cn(
              'relative w-full bg-surface shadow-card',
              size === 'lg'
                ? 'max-w-[min(860px,94vw)] rounded-[1.5rem]'
                : 'max-w-[min(600px,92vw)] rounded-[18px]',
              panelClassName
            )}
          >
            {title ? <DialogTitle className="sr-only">{title}</DialogTitle> : null}
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
