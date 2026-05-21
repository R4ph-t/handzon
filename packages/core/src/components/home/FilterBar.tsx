import { GraduationCap, Hash, Search } from "lucide-react";
import { useEffect, useState } from "react";
import MultiSelect, { type MultiSelectOption } from "../ui/MultiSelect.tsx";
import ActiveFilterChips from "./ActiveFilterChips.tsx";
import SortBar from "./SortBar.tsx";

interface Props {
  difficulties: string[];
  tags: string[];
  /** Hit counts per difficulty value, server-computed. */
  difficultyCounts: Record<string, number>;
  /** Hit counts per tag, server-computed. */
  tagCounts: Record<string, number>;
}

interface FilterState {
  q: string;
  levels: Set<string>;
  tags: Set<string>;
}

function parseCsv(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
}

function readUrlState(): FilterState {
  if (typeof window === "undefined") {
    return { q: "", levels: new Set(), tags: new Set() };
  }
  const url = new URL(window.location.href);
  const levels = url.searchParams.get("level")
    ? parseCsv(url.searchParams.get("level"))
    : // Legacy single-value shape; honor on read so shared links keep
      // working. The next interaction rewrites to ?level=.
      parseCsv(url.searchParams.get("difficulty"));
  return {
    q: url.searchParams.get("q") ?? "",
    levels,
    tags: parseCsv(url.searchParams.get("tag")),
  };
}

function writeUrlState(state: FilterState) {
  const url = new URL(window.location.href);
  if (state.q) url.searchParams.set("q", state.q);
  else url.searchParams.delete("q");
  if (state.levels.size > 0) url.searchParams.set("level", [...state.levels].join(","));
  else url.searchParams.delete("level");
  if (state.tags.size > 0) url.searchParams.set("tag", [...state.tags].join(","));
  else url.searchParams.delete("tag");
  // Always strip the legacy key so an upgraded URL doesn't carry both
  // shapes. First user interaction "migrates" the link.
  url.searchParams.delete("difficulty");
  window.history.replaceState({}, "", url.toString());
}

function applyFilters(state: FilterState) {
  const cards = document.querySelectorAll<HTMLElement>("[data-search]");
  const q = state.q.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesQ = !q || card.dataset.search!.includes(q);
    const matchesLevel =
      state.levels.size === 0 || state.levels.has(card.dataset.difficulty ?? "");
    const cardTags = (card.dataset.tags ?? "").split(",");
    const matchesTag =
      state.tags.size === 0 || cardTags.some((t) => state.tags.has(t));
    const show = matchesQ && matchesLevel && matchesTag;
    if (show) {
      card.removeAttribute("data-filter-hidden");
      visible += 1;
    } else {
      card.setAttribute("data-filter-hidden", "");
    }
  });
  // Empty state element controls its own visibility; we just set it.
  // The Home.astro inline empty-state is shown when visible === 0.
  const empty = document.querySelector<HTMLElement>("[data-empty-state]");
  if (empty) empty.style.display = visible === 0 ? "" : "none";
  // Results status line. Read total from rendered card count (server
  // SSR'd them; localStorage / pagination don't change cards.length).
  const status = document.querySelector<HTMLElement>("[data-results-status]");
  if (status) {
    const total = cards.length;
    if (total === 0) {
      status.textContent = "";
    } else if (visible === total) {
      status.textContent = `Showing all ${total} tutorial${total === 1 ? "" : "s"}`;
    } else {
      status.textContent = `Showing ${visible} of ${total} tutorial${total === 1 ? "" : "s"}`;
    }
  }
  // Fire once per state transition so Pagination resets to page 1.
  window.dispatchEvent(new CustomEvent("hz:filter-changed"));
}

export default function FilterBar({
  difficulties,
  tags,
  difficultyCounts,
  tagCounts,
}: Props) {
  const [state, setState] = useState<FilterState>(readUrlState);

  useEffect(() => {
    applyFilters(state);
    writeUrlState(state);
  }, [state]);

  function setQ(q: string) {
    setState((prev) => ({ ...prev, q }));
  }
  function setLevels(levels: Set<string>) {
    setState((prev) => ({ ...prev, levels }));
  }
  function setTags(next: Set<string>) {
    setState((prev) => ({ ...prev, tags: next }));
  }
  function removeLevel(level: string) {
    setState((prev) => {
      const next = new Set(prev.levels);
      next.delete(level);
      return { ...prev, levels: next };
    });
  }
  function removeTag(tag: string) {
    setState((prev) => {
      const next = new Set(prev.tags);
      next.delete(tag);
      return { ...prev, tags: next };
    });
  }
  function clearAll() {
    setState({ q: "", levels: new Set(), tags: new Set() });
  }

  const levelOpts: MultiSelectOption[] = difficulties.map((d) => ({
    value: d,
    label: d,
    count: difficultyCounts[d] ?? 0,
  }));
  const tagOpts: MultiSelectOption[] = tags.map((t) => ({
    value: t,
    label: `#${t}`,
    count: tagCounts[t] ?? 0,
  }));

  const hasActive = state.q.length > 0 || state.levels.size > 0 || state.tags.size > 0;

  return (
    <div className="filterbar">
      <div className="fb-toolbar">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search tutorials…"
            value={state.q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search tutorials"
          />
        </label>

        <MultiSelect
          id="hz-level"
          label="Level"
          values={state.levels}
          onChange={setLevels}
          options={levelOpts}
          triggerIcon={<GraduationCap size={14} aria-hidden="true" />}
        />

        <MultiSelect
          id="hz-topics"
          label="Topics"
          values={state.tags}
          onChange={setTags}
          options={tagOpts}
          searchable
          triggerIcon={<Hash size={14} aria-hidden="true" />}
        />

        <span className="fb-divider" aria-hidden="true" />
        <div className="fb-sort-slot">
          <SortBar />
        </div>
      </div>

      {hasActive && (
        <ActiveFilterChips
          q={state.q}
          levels={state.levels}
          tags={state.tags}
          onClearQ={() => setQ("")}
          onRemoveLevel={removeLevel}
          onRemoveTag={removeTag}
          onClearAll={clearAll}
        />
      )}
    </div>
  );
}
