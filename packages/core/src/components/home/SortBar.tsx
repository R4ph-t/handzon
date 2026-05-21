import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import Dropdown, { type DropdownOption } from "../ui/Dropdown.tsx";

/**
 * Sort dropdown for the homepage tutorial grid. Lives above the grid
 * (not inside the filterbar) so the UI affordance signals "order"
 * rather than "filter".
 *
 * URL-driven via `?sort=`. Empty value = the curated default order;
 * `popular` = sort by client-hydrated `data-popularity` desc.
 * Emits `hz:sort-changed` so the inline script on Home.astro that
 * rewrites CSS `order` on each card re-runs without React coupling.
 */
type SortValue = "" | "popular";

const OPTIONS: DropdownOption<SortValue>[] = [
  { value: "", label: "Default" },
  { value: "popular", label: "Most popular" },
];

function readSortFromUrl(): SortValue {
  if (typeof window === "undefined") return "";
  const v = new URL(window.location.href).searchParams.get("sort") ?? "";
  return (OPTIONS.some((o) => o.value === v) ? v : "") as SortValue;
}

function writeSortToUrl(value: SortValue) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("sort", value);
  else url.searchParams.delete("sort");
  window.history.replaceState({}, "", url.toString());
}

export default function SortBar() {
  const [sort, setSort] = useState<SortValue>("");

  // Read once on mount (client-only) so SSR doesn't try to touch
  // `window`. After the initial sync, the dropdown owns the URL.
  useEffect(() => {
    setSort(readSortFromUrl());
  }, []);

  useEffect(() => {
    writeSortToUrl(sort);
    window.dispatchEvent(new CustomEvent("hz:sort-changed", { detail: { sort } }));
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
