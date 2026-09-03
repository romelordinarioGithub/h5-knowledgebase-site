import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type TagProps = HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-white px-2.5 py-0.5 text-xs text-ink',
        className
      )}
      {...props}
    />
  );
}
