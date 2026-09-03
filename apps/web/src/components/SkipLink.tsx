/**
 * Skip-to-content link for keyboard users (WCAG 2.4.1).
 * Place as the first focusable element in the document.
 */
export function SkipLink({ href = '#main-content' }: { href?: string }) {
  return (
    <a href={href} className="skip-link">
      Skip to content
    </a>
  );
}
