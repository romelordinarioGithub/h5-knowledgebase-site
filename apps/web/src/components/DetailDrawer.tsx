import type { ReactNode } from 'react';
import type { CatalogRow } from '../types/catalog';
import { DocumentDetail } from './DocumentDetail';
import { Modal, ModalClose } from './ui';

type DetailDrawerProps = {
  row: CatalogRow | null;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
};

export function DetailDrawer({ row, open, onClose, footer }: DetailDrawerProps) {
  return (
    <Modal open={open} onClose={onClose} title={row?.title || 'Document details'} size="md">
      <div className="relative flex flex-col gap-2.5 bg-surface p-6">
        <ModalClose onClick={onClose} label="Close details" />
        <div className="mt-11 flex flex-col gap-2.5">
          {row ? <DocumentDetail row={row} footer={footer} /> : null}
        </div>
      </div>
    </Modal>
  );
}
