export const CATALOG_PAGE_SIZE = 6;
const MAX_VISIBLE_PAGE_LINKS = 5;

export type PaginationResult<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  pageNumbers: number[];
};

export function paginateItems<T>(
  items: T[],
  requestedPage: string | undefined,
  pageSize = CATALOG_PAGE_SIZE,
): PaginationResult<T> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive safe integer.");
  }

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const parsedPage = requestedPage && /^\d+$/.test(requestedPage) ? Number(requestedPage) : 1;
  const currentPage = Number.isSafeInteger(parsedPage)
    ? Math.min(Math.max(parsedPage, 1), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePageCount = Math.min(totalPages, MAX_VISIBLE_PAGE_LINKS);
  const firstVisiblePage = Math.min(
    Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGE_LINKS / 2)),
    totalPages - visiblePageCount + 1,
  );

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    totalItems,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: Math.min(startIndex + pageSize, totalItems),
    pageNumbers: Array.from({ length: visiblePageCount }, (_, index) => firstVisiblePage + index),
  };
}
