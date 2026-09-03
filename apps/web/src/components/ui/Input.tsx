import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  rounded?: 'md' | 'full';
  ref?: Ref<HTMLInputElement>;
};

export function Input({ className, rounded = 'md', ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20',
        rounded === 'full' ? 'rounded-full' : 'rounded-xl',
        className
      )}
      {...props}
    />
  );
}
