import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'source' | 'date' | 'soft';
};

const tones = {
  source: 'bg-[#e8f3fa] text-[#0f5f8c] rounded px-3 h-6 text-xs font-semibold',
  date: 'bg-primary-soft text-primary-dark rounded-full px-2.5 py-0.5 text-[0.76rem] font-semibold',
  soft: 'bg-[#efe6fb] text-[#432184] rounded-full px-2.5 py-1 text-xs font-bold',
};

export function Badge({ className, tone = 'source', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap leading-none',
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
