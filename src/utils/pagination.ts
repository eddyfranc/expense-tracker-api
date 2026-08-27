import type { PaginationMeta } from "./response.js";

export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePaginationParams(pageQuery?: unknown, limitQuery?: unknown): PaginationParams {
  const page = Math.max(1, parseInt(String(pageQuery || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(limitQuery || "20"), 10) || 20));
  return { page, limit };
}

export function buildPaginationMeta(totalItems: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    page,
    limit,
    total_items: totalItems,
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_prev_page: page > 1,
  };
}
