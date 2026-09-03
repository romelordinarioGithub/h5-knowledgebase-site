type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="sticky top-0 z-50 border-b border-[#f0c987] bg-[#fff4e5] px-4 py-2.5 text-center text-[0.92rem] text-[#6b4a12]"
      role="status"
    >
      {message}
    </div>
  );
}
