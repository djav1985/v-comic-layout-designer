/**
 * Returns the CSRF token from the meta tag injected by the server.
 * @returns {string}
 */
export function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") || "" : "";
}

/**
 * Returns a headers object containing the X-CSRF-Token header.
 * Merge this into every mutating fetch() call.
 * @returns {{ "X-CSRF-Token": string }}
 */
export function getCsrfHeaders() {
  return { "X-CSRF-Token": getCsrfToken() };
}
