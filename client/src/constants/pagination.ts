export const MAX_PAGINATION_LIMIT = 50;

export function clampPaginationLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 1;
  return Math.min(Math.trunc(limit), MAX_PAGINATION_LIMIT);
}
