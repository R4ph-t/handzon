import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import Dropdown, { type DropdownOption } from "../ui/Dropdown.tsx";

/**
 * Sort dropdown for the homepage tutorial grid. Lives above the grid
 * (not inside the filterbar) so the UI affordance signals "order"
 * rather than "filter".
 *
 * URL-driven via `?sort=`. Internally we use the sentinel "default"
 * because Radix Select forbids "" as an item value; the URL still
 * uses an absent param to mean "curated default order".
 * Emits `hz:sort-changed` so the inline script on Home.astro that
 * rewrites CSS `order` on each card re-runs without React coupling.
 */
type SortValue = "default" | "popular";

const OPTIONS: DropdownOption<SortValue>[] = [
  { value: "default", label: "Default" },
  { value: "popular", label: "Most popular" },
];

function readSortFromUrl(): SortValue {
  if (typeof window === "undefined") return "default";
  const v = new URL(window.location.href).searchParams.get("sort") ?? "";
  return v === "popular" ? "popular" : "default";
}

function writeSortToUrl(value: SortValue) {
  const url = new URL(window.location.href);
  if (value === "popular") url.searchParams.set("sort", "popular");
  else url.searchParams.delete("sort");
  window.history.replaceState({}, "", url.toString());
}

export default function SortBar() {
  const [sort, setSort] = useState<SortValue>("default");

  // Read once on mount (client-only) so SSR doesn't try to touch
  // `window`. After the initial sync, the dropdown owns the URL.
  useEffect(() => {
    setSort(readSortFromUrl());
  }, []);

  useEffect(() => {
    writeSortToUrl(sort);
    // Translate the internal sentinel back to "" on the wire so the
    // existing Home.astro inline reorder script (which checks for the
    // "popular" string) keeps working without changes.
    const wire = sort === "popular" ? "popular" : "";
    window.dispatchEvent(new CustomEvent("hz:sort-changed", { detail: { sort: wire } }));
  }, [sort]);

  return (
    <Dropdown<SortValue>
      id="hz-sort"
      value={sort}
      onChange={setSort}
      options={OPTIONS}
      label="Sort"
      triggerIcon={<ArrowUpDown size={14} aria-hidden="true" />}
      ariaLabel="Sort tutorials"
    />
  );
}
