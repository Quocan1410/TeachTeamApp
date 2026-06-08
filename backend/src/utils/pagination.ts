export type PaginationInput = {
    page?: number | string;
    pageSize?: number | string;
};

export type PaginatedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function normalizePagination(input?: PaginationInput): {
    page: number;
    pageSize: number;
    skip: number;
} {
    const rawPage = parseInt(String(input?.page ?? DEFAULT_PAGE), 10);
    const rawSize = parseInt(String(input?.pageSize ?? DEFAULT_PAGE_SIZE), 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
    const pageSize =
        Number.isFinite(rawSize) && rawSize > 0
            ? Math.min(rawSize, MAX_PAGE_SIZE)
            : DEFAULT_PAGE_SIZE;

    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
    };
}

export function paginatedResult<T>(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number
): PaginatedResult<T> {
    return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
}
