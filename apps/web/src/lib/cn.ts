type ClassValue = string | false | null | undefined;

export function cn(...parts: ClassValue[]) {
  return parts.filter(Boolean).join(' ');
}
