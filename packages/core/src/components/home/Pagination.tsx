import { useEffect, useState } from "react";

interface Props {
  /** How many cards to show per page. */
  pageSize?: number;
}

/**
 * Client-side pagination for the homepage tutorial grid.
 *
 * Works in concert with FilterBar:
 * - FilterBar marks non-matching cards with `data-filter-hidden`.
 * - Pagination marks beyond-page cards with `data-page-hidden`.
 * - The CSS hides a card if either attribute is set.
 *
 * FilterBar fires a `hz:filter-changed` window event when the filter
 * state changes; pagination listens and resets to page 1, then
 * re-applies the page slice over the new filtered set.
 */
function applyPagination(page: number, pageSize: number): number {
  const visibleByFilter = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[data-search]:not([data-filter-hidden])",
    ),
  );
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  visibleByFilter.forEach((card, idx) => {
    if (idx >= start && idx < end) {
      card.removeAttribute("data-page-hidden");
    } else {
      card.setAttribute("data-page-hidden", "");
    }
  });
  return visibleByFilter.length;
}

export default function Pagination({ pageSize = 9 }: Props) {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(applyPagination(page, pageSize));
  }, [page, pageSize]);

  useEffect(() => {
    function onFilterChanged() {
      setPage(1);
      setTotal(applyPagination(1, pageSize));
    }
    window.addEventListener("hz:filter-changed", onFilterChanged);
    return () => window.removeEventListener("hz:filter-changed", onFilterChanged);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  // Keep state coherent if the filter shrinks below the current page.
  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  if (total <= pageSize) return null;

  return (
    <nav className="pagination" aria-label="Tutorial pages">
      <button
        type="button"
        className="pg-btn"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={safePage <= 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <span className="pg-status" aria-live="polite">
        Page <strong>{safePage}</strong> of {totalPages}
      </span>
      <button
        type="button"
        className="pg-btn"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={safePage >= totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
