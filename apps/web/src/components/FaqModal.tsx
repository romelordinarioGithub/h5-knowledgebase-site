import { DEFAULT_FAQS } from '../lib/constants';
import { sanitizeFaqHtml } from '../lib/sanitizeHtml';
import type { FaqItem } from '../types/catalog';
import { Badge, Modal, ModalClose } from './ui';

type FaqModalProps = {
  open: boolean;
  onClose: () => void;
  faqs: FaqItem[];
};

export function FaqModal({ open, onClose, faqs }: FaqModalProps) {
  const items = faqs.length ? faqs : DEFAULT_FAQS;

  return (
    <Modal open={open} onClose={onClose} title="Frequently Asked Questions" size="lg">
      <div className="relative flex flex-col gap-3.5 rounded-[22px] bg-white px-[26px] pt-[26px] pb-[30px]">
        <ModalClose onClick={onClose} label="Close FAQ" />
        <Badge tone="soft" className="mx-auto">
          FAQ
        </Badge>
        <h2 className="m-0 text-center text-[clamp(2rem,4vw,2.7rem)] leading-[1.05] text-[#121024]">
          Frequently Asked Questions
        </h2>
        <p className="mx-auto mb-1.5 max-w-[680px] text-center text-base text-muted">
          Everything you need to know to use this internal knowledge base quickly.
        </p>

        <div className="mt-2 grid gap-0 border-t border-[#ddd5ef]">
          {items.map((item, index) => {
            const safeHtml = item.answerHtml ? sanitizeFaqHtml(item.answerHtml) : '';
            return (
              <details
                key={`faq-${index}`}
                className="faq-item border-0 border-b border-[#ddd5ef] bg-transparent p-0"
              >
                <summary>{item.question}</summary>
                {safeHtml ? (
                  <div
                    className="faq-answer mb-5 text-[0.92rem] leading-normal whitespace-pre-wrap text-[#4a445f] [&_a]:font-semibold [&_a]:text-primary-dark [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-bold [&_strong]:text-[#2a2143]"
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                  />
                ) : (
                  <p className="mb-5 text-[0.92rem] leading-normal whitespace-pre-wrap text-[#4a445f]">
                    {item.answer}
                  </p>
                )}
              </details>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
