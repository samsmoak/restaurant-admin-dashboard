// Admin dashboard lives at its own domain — all routes are root-level.
// Helpers keep their original names so studio pages that import
// `studioPath` or `STUDIO_HOME` keep working without edits.

export const STUDIO_HOME = "/";
export const STUDIO_LOGIN = "/login";
export const STUDIO_ONBOARD = "/onboard";

export function studioPath(suffix = ""): string {
  if (!suffix) return STUDIO_HOME;
  const clean = suffix.startsWith("/") ? suffix.slice(1) : suffix;
  return `/${clean}`;
}
