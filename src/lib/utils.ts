export function debounce<F extends (...args: never[]) => void>(fn: F, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

export function formatDate(date: Date | string | number) {
  const d = new Date(date);
  // Deterministic server/client formatting
  const formatted = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
  return formatted.replace(',', '');
}

export function safeString(input: unknown): string {
  return String(input ?? '');
}


