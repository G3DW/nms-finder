export function formatRelativeDate(value: string) {
  const target = new Date(value).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.round((now - target) / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return 'today';
  }

  if (diffDays === 1) {
    return '1 day ago';
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths === 1) {
    return '1 month ago';
  }

  return `${diffMonths} months ago`;
}
