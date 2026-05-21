import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  difficulties: string[];
  tags: string[];
}

function readUrlState() {
  if (typeof window === "undefined") return { q: "", difficulty: "", tag: "" };
  const url = new URL(window.location.href);
  return {
    q: url.searchParams.get("q") ?? "",
    difficulty: url.searchParams.get("difficulty") ?? "",
    tag: url.searchParams.get("tag") ?? "",
  };
}

function writeUrlState(state: { q: string; difficulty: string; tag: string }) {
  const url = new URL(window.location.href);
  if (state.q) url.searchParams.set("q", state.q);
  else url.searchParams.delete("q");
  if (state.difficulty) url.searchParams.set("difficulty", state.difficulty);
  else url.searchParams.delete("difficulty");
  if (state.tag) url.searchParams.set("tag", state.tag);
  else url.searchParams.delete("tag");
  window.history.replaceState({}, "", url.toString());
}

function applyFilters(state: { q: string; difficulty: string; tag: string }) {
  const cards = document.querySelectorAll<HTMLElement>("[data-search]");
  const q = state.q.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesQ = !q || card.dataset.search!.includes(q);
    const matchesDiff = !state.difficulty || card.dataset.difficulty === state.difficulty;
    const matchesTag = !state.tag || (card.dataset.tags ?? "").split(",").includes(state.tag);
    const show = matchesQ && matchesDiff && matchesTag;
    if (show) {
      card.removeAttribute("data-filter-hidden");
      visible += 1;
    } else {
      card.setAttribute("data-filter-hidden", "");
    }
  });
  const empty = document.querySelector<HTMLElement>("[data-empty-state]");
  if (empty) empty.style.display = visible === 0 ? "" : "none";
  // Notify Pagination (and any other listeners) that the filtered set
  // changed so they can reset their slice.
  window.dispatchEvent(new CustomEvent("hz:filter-changed"));
}

export default function FilterBar({ difficulties, tags }: Props) {
  const [state, setState] = useState(readUrlState);

  useEffect(() => {
    applyFilters(state);
    writeUrlState(state);
  }, [state]);

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function clear() {
    setState({ q: "", difficulty: "", tag: "" });
  }

  const hasFilters = state.q || state.difficulty || state.tag;

  return (
    <div className="filterbar">
      {/* Row 1: search takes the lion's share + level + clear */}
      <div className="fb-row fb-row-primary">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search tutorials…"
            value={state.q}
            onChange={(e) => set("q", e.target.value)}
            aria-label="Search tutorials"
          />
        </label>

        <div className="pills" role="group" aria-label="Difficulty">
          {difficulties.map((d) => (
            <button
              key={d}
              type="button"
              className={`pill ${state.difficulty === d ? "is-active" : ""}`}
              onClick={() => set("difficulty", state.difficulty === d ? "" : d)}
            >
              {d}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button type="button" className="clear" onClick={clear}>
            <X size={14} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {/* Row 2: tags wrap freely under the primary row */}
      {tags.length > 0 && (
        <div className="pills pills-tags" role="group" aria-label="Tags">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill ${state.tag === t ? "is-active" : ""}`}
              onClick={() => set("tag", state.tag === t ? "" : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
