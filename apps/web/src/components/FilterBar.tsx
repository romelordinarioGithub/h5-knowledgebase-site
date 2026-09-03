import { SORT_OPTIONS } from '../lib/constants';
import type { SortKey } from '../lib/search';
import { Select } from './ui';

type LinkTypeOption = {
  value: string;
  label: string;
};

type FilterBarProps = {
  sheetOptions: string[];
  typeOptions: string[];
  linkTypeOptions: LinkTypeOption[];
  selectedSheet: string;
  selectedType: string;
  selectedLinkType: string;
  selectedSort: SortKey;
  onSheetChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onLinkTypeChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
};

export function FilterBar({
  sheetOptions,
  typeOptions,
  linkTypeOptions,
  selectedSheet,
  selectedType,
  selectedLinkType,
  selectedSort,
  onSheetChange,
  onTypeChange,
  onLinkTypeChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <section
      className="mt-[34px] grid grid-cols-2 gap-3 max-[820px]:grid-cols-1 min-[1100px]:grid-cols-4"
      aria-label="Search and filters"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.84rem] text-muted">Source Sheet</span>
        <Select
          value={selectedSheet}
          onChange={onSheetChange}
          options={sheetOptions.map((value) => ({ value, label: value }))}
          placeholder="All"
          clearable
          aria-label="Source Sheet"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.84rem] text-muted">Document Title</span>
        <Select
          value={selectedType}
          onChange={onTypeChange}
          options={typeOptions.map((value) => ({ value, label: value }))}
          placeholder="All"
          clearable
          aria-label="Document Title"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.84rem] text-muted">Link Type</span>
        <Select
          value={selectedLinkType}
          onChange={onLinkTypeChange}
          options={linkTypeOptions}
          placeholder="All"
          clearable
          aria-label="Link Type"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.84rem] text-muted">Sort By</span>
        <Select
          value={selectedSort}
          onChange={(value) => onSortChange((value as SortKey) || 'newest')}
          options={SORT_OPTIONS}
          aria-label="Sort By"
        />
      </label>
    </section>
  );
}
