// Query-string helpers for UI tuning and seed overrides.

export function parseQueryParams(search = window.location.search): Record<string, string> {
  const params = new URLSearchParams(search);
  const entries: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    entries[key] = value;
  }

  return entries;
}
