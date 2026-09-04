/** Shared source-type icons (Articles table + article detail). */

export function SourceIcon({
  linkType,
  size = 14,
}: {
  linkType?: string;
  size?: number;
}) {
  if (linkType === 'google_slides') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#F4B400" />
        <path d="M14 2v6h6" fill="#FDE293" />
        <rect x="7" y="11" width="10" height="7" rx="1" fill="#ffffff" opacity="0.9" />
        <rect x="9" y="13" width="6" height="3" rx="0.5" fill="#F4B400" />
      </svg>
    );
  }
  if (linkType === 'google_doc') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#4285F4" />
        <path d="M14 2v6h6" fill="#A1C2FA" />
        <path d="M16 13H8m8 4H8m3-8H8" stroke="#ffffff" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }
  if (linkType === 'google_sheet') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#0F9D58" />
        <path d="M14 2v6h6" fill="#87CEAC" />
        <path d="M7 11h10v8H7z" fill="#0F9D58" />
        <path
          d="M7 11h10M7 15h10M7 19h10M12 11v8"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  if (linkType === 'google_drive') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.7 3.5L12 11 9.4 15.5 3 4.5h4.7z" fill="#0066DA" />
        <path d="M14.6 3.5h6.4L15.3 13.5 12 11l2.6-7.5z" fill="#FFBA00" />
        <path d="M3 20.5l3.2-5.5H21l-3.2 5.5H3z" fill="#00AC47" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--kb-outline)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
