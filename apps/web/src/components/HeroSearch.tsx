import type { Ref } from 'react';
import { Input } from './ui';

type HeroSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onOpenFaq: () => void;
  inputRef?: Ref<HTMLInputElement>;
};

export function HeroSearch({ value, onChange, onOpenFaq, inputRef }: HeroSearchProps) {
  return (
    <header className="hero">
      <div className="hero-overlay" aria-hidden="true" />
      <button
        type="button"
        className="absolute top-[18px] right-[22px] z-[3] border-0 bg-transparent p-0 text-[0.9rem] font-bold text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={onOpenFaq}
      >
        FAQ
      </button>
      <div className="relative z-[1] mx-auto w-[min(920px,92vw)] px-0 pt-[90px] pb-[50px] text-center text-white max-[820px]:pt-[70px]">
        <p className="m-0 text-[0.85rem] tracking-[0.08em] uppercase text-white/95">
          H5 Team Knowledge Base
        </p>
        <h1 className="mt-2.5 mb-3.5 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] font-bold">
          How Can We Help?
        </h1>
        <p className="mx-auto mt-0 mb-0 max-w-[700px] text-[1.08rem] text-white/95">
          Find answers quickly across all internal documentation
        </p>
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Search for answers... (press / to focus)"
          rounded="full"
          className="hero-search border-0 bg-white text-ink"
          aria-label="Search knowledge base"
        />
      </div>
    </header>
  );
}
