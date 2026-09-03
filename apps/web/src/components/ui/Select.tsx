import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { cn } from '../../lib/cn';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = 'All',
  clearable = false,
  className,
  id,
  'aria-label': ariaLabel,
}: SelectProps) {
  const selected = options.find((option) => option.value === value) || null;
  const display = selected?.label || placeholder;

  return (
    <Listbox value={value || null} onChange={(next) => onChange(next || '')}>
      <div className={cn('relative', className)}>
        <ListboxButton
          id={id}
          aria-label={ariaLabel}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 data-open:border-primary"
        >
          <span className={cn(!selected && 'text-muted')}>{display}</span>
          <span className="text-muted" aria-hidden="true">
            ▾
          </span>
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          className="z-50 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-line bg-surface p-1 shadow-card outline-none empty:invisible"
        >
          {clearable ? (
            <ListboxOption
              value=""
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted data-focus:bg-primary-soft data-selected:font-semibold data-selected:text-primary"
            >
              {placeholder}
            </ListboxOption>
          ) : null}
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink data-focus:bg-primary-soft data-selected:font-semibold data-selected:text-primary"
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
