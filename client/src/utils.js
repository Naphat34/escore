export function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

export function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '');
}

export function removeCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

/**
 * Formats a date string or object to Thai Buddhist Era format.
 * @param {Date|string} date - The date to format.
 * @param {Object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date.
 */
export function formatThaiDate(date, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('th-TH', {
    ...options
  });
}

/**
 * Formats a date string or object to 24-hour time format (Thai locale).
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted time.
 */
export function formatThaiTime(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats a date string or object to both Thai Date and 24-hour Time.
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted date and time.
 */
export function formatThaiDateTime(date) {
  if (!date) return 'TBD';
  return `${formatThaiDate(date)} ${formatThaiTime(date)}`;
}
/**
 * Converts a date to local YYYY-MM-DDTHH:mm format for input fields.
 * Handles both JS Date objects and ISO strings.
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted date string for input value.
 */
export function formatForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
