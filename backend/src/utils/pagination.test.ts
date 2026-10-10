import { normalizePagination, paginatedResult } from "./pagination";

describe("normalizePagination", () => {
  it("uses defaults when input is missing", () => {
    expect(normalizePagination()).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
    });
  });

  it("caps page size at 100", () => {
    expect(normalizePagination({ page: 2, pageSize: 500 })).toEqual({
      page: 2,
      pageSize: 100,
      skip: 100,
    });
  });

  it("falls back for invalid page values", () => {
    expect(normalizePagination({ page: 0, pageSize: -3 })).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
    });
  });
});

describe("paginatedResult", () => {
  it("computes total pages", () => {
    expect(paginatedResult(["a", "b"], 21, 1, 10)).toEqual({
      items: ["a", "b"],
      totalCount: 21,
      page: 1,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it("keeps at least one page when the list is empty", () => {
    expect(paginatedResult([], 0, 1, 20).totalPages).toBe(1);
  });
});
