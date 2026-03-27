export const MAX_PAGINATION_LIMIT = 50;

export const DEFAULT_PAGINATION_LIMIT = 10;

export function clampPaginationLimit(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_PAGINATION_LIMIT;
  return Math.min(Math.trunc(raw), MAX_PAGINATION_LIMIT);
}
