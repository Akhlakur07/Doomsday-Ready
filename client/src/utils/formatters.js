/**
 * Format minutes into a compact human-readable runtime string.
 */
export function formatRuntime(totalMinutes) {
  const mins = Number(totalMinutes) || 0;
  if (mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h ${String(rem).padStart(2, '0')}m (${mins} min)`;
}

/**
 * Resolve the upcoming December 18 opening-night target date in local time.
 */
export function getDoomsdayTargetDate(now = new Date()) {
  const year = now.getFullYear();
  const candidate = new Date(year, 11, 18, 23, 0, 0, 0);
  if (now.getTime() >= candidate.getTime()) {
    return new Date(year + 1, 11, 18, 23, 0, 0, 0);
  }
  return candidate;
}

/**
 * Compute zero-padded calendar months, days, hours, minutes, and seconds
 * remaining until the target date.
 */
export function computeCalendarCountdown(now, target) {
  if (now.getTime() >= target.getTime()) {
    return {
      months: '00',
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
      targetYear: target.getFullYear(),
      isArrived: true,
    };
  }

  let months = 0;
  const cursor = new Date(now.getTime());

  while (months < 24) {
    const next = new Date(cursor.getTime());
    next.setMonth(next.getMonth() + 1);
    if (next.getTime() <= target.getTime()) {
      cursor.setTime(next.getTime());
      months += 1;
    } else {
      break;
    }
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((target.getTime() - cursor.getTime()) / 1000)
  );
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  const pad = (value) => String(value).padStart(2, '0');

  return {
    months: pad(months),
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    targetYear: target.getFullYear(),
    isArrived: false,
  };
}
