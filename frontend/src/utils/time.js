export function parseUtc(dateString) {
  if (!dateString) return null;
  // If no timezone indicator exists (Z or +/- offset), append 'Z'
  const hasTimezone = /(Z|[+-]\d{2}:\d{2})$/.test(dateString);
  const normalized = hasTimezone ? dateString : `${dateString}Z`;
  return new Date(normalized);
}

export function timeAgo(dateString) {
  const date = parseUtc(dateString);
  if (!date) return '';

  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
