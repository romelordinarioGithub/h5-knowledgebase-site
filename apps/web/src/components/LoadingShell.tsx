export function LoadingShell() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto mt-[46px] mb-16 w-[min(1080px,92vw)] outline-none max-[820px]:mt-7"
      aria-busy="true"
      aria-label="Loading catalog"
    >
      <div className="skeleton mx-auto mb-6 h-10 w-64" />
      <div className="grid grid-cols-5 gap-[18px] max-[820px]:flex max-[820px]:overflow-x-auto">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`shell-topic-${index}`} className="skeleton min-h-[210px] min-w-[250px]" />
        ))}
      </div>
      <div className="mt-14 rounded-lg border border-[#e7e1f3] bg-[#f7f6fa] p-[34px]">
        <div className="skeleton mb-4 h-8 w-56" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`shell-feat-${index}`} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`shell-filter-${index}`} className="skeleton h-11 w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`shell-card-${index}`} className="skeleton min-h-[160px] rounded-card" />
        ))}
      </div>
    </main>
  );
}
