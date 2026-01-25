/**
 * Format a date according to a PHP-style format string
 * Supports common patterns used in the settings
 */
export function formatDate(date: Date, format: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const pad = (num: number): string => num.toString().padStart(2, '0');

  // Use numbered placeholders to avoid replacing characters in already-replaced text
  // (e.g., 'd' in 'Friday' being replaced with the day number)
  // Replacements are ordered from longest to shortest pattern to avoid partial matches
  const replacements: Array<{ pattern: string; placeholder: string; value: string }> = [
    { pattern: 'EEEE', placeholder: '__PH1__', value: days[date.getDay()] },
    { pattern: 'EEE', placeholder: '__PH2__', value: daysShort[date.getDay()] },
    { pattern: 'MMMM', placeholder: '__PH3__', value: months[date.getMonth()] },
    { pattern: 'MMM', placeholder: '__PH4__', value: monthsShort[date.getMonth()] },
    { pattern: 'MM', placeholder: '__PH5__', value: pad(date.getMonth() + 1) },
    { pattern: 'yyyy', placeholder: '__PH6__', value: date.getFullYear().toString() },
    { pattern: 'dd', placeholder: '__PH7__', value: pad(date.getDate()) },
    { pattern: 'd', placeholder: '__PH8__', value: date.getDate().toString() },
    { pattern: 'M', placeholder: '__PH9__', value: (date.getMonth() + 1).toString() },
  ];

  let result = format;

  // Step 1: Replace patterns with placeholders (longest first to avoid partial matches)
  for (const { pattern, placeholder } of replacements) {
    result = result.split(pattern).join(placeholder);
  }

  // Step 2: Replace placeholders with actual values
  for (const { placeholder, value } of replacements) {
    result = result.split(placeholder).join(value);
  }

  return result;
}

/**
 * Format time according to 12 or 24 hour format with optional seconds
 */
export function formatTime(date: Date, format: '12' | '24', showSeconds: boolean): string {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  if (format === '12') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const time = showSeconds
      ? `${hours}:${minutes}:${seconds} ${ampm}`
      : `${hours}:${minutes} ${ampm}`;
    return time;
  } else {
    const hoursStr = hours.toString().padStart(2, '0');
    const time = showSeconds
      ? `${hoursStr}:${minutes}:${seconds}`
      : `${hoursStr}:${minutes}`;
    return time;
  }
}

/**
 * Get the appropriate welcome message based on time of day
 */
export function getTimeBasedWelcomeMessage(
  morning: string,
  afternoon: string,
  evening: string
): string {
  const hour = new Date().getHours();

  // Morning: 5 AM - 12 PM (5-11)
  if (hour >= 5 && hour < 12) {
    return morning;
  }

  // Afternoon: 12 PM - 5 PM (12-16)
  if (hour >= 12 && hour < 17) {
    return afternoon;
  }

  // Evening: 5 PM - 5 AM (17-23, 0-4)
  return evening;
}
