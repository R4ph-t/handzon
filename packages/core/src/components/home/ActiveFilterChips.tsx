import { X } from "lucide-react";
import type { KeyboardEvent } from "react";

interface Props {
  q: string;
  levels: Set<string>;
  tags: Set<string>;
  onClearQ: () => void;
  onRemoveLevel: (level: string) => void;
  onRemoveTag: (tag: string) => void;
  onClearAll: () => void;
}

/**
 * Active-filter chip row. Pure presentation — the parent FilterBar
 * owns state mutations and URL writes. Shown only when the parent
 * has determined at least one filter is active.
 *
 * Each chip is a button. Clicking removes the facet value.
 * Backspace/Delete on a focused chip removes it via keyboard.
 *
 * The trailing "Clear all" sits at the end and resets everything
 * (search + levels + tags). This is the only "clear" affordance now;
 * the in-toolbar Clear button was removed.
 */
export default function ActiveFilterChips({
  q,
  levels,
  tags,
  onClearQ,
  onRemoveLevel,
  onRemoveTag,
  onClearAll,
}: Props) {
  function chipKey(e: KeyboardEvent<HTMLButtonElement>, remove: () => void) {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      remove();
    }
  }

  return (
    <div className="active-filters" role="group" aria-label="Active filters">
      {q && (
        <button
          type="button"
          className="active-filter-chip"
          aria-label={`Remove search: ${q}`}
          onClick={onClearQ}
          onKeyDown={(e) => chipKey(e, onClearQ)}
        >
          <span className="afc-label">search: {q}</span>
          <X size={12} aria-hidden="true" />
        </button>
      )}
      {[...levels].sort().map((level) => (
        <button
          key={`l:${level}`}
          type="button"
          className="active-filter-chip"
          aria-label={`Remove level: ${level}`}
          onClick={() => onRemoveLevel(level)}
          onKeyDown={(e) => chipKey(e, () => onRemoveLevel(level))}
        >
          <span className="afc-label">{level}</span>
          <X size={12} aria-hidden="true" />
        </button>
      ))}
      {[...tags].sort().map((tag) => (
        <button
          key={`t:${tag}`}
          type="button"
          className="active-filter-chip"
          aria-label={`Remove topic: ${tag}`}
          onClick={() => onRemoveTag(tag)}
          onKeyDown={(e) => chipKey(e, () => onRemoveTag(tag))}
        >
          <span className="afc-label">#{tag}</span>
          <X size={12} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        className="active-filter-clear"
        onClick={onClearAll}
      >
        Clear all
      </button>
    </div>
  );
}
