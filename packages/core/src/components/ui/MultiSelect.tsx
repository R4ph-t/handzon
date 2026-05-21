import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
  count: number;
}

export interface MultiSelectProps {
  values: Set<string>;
  onChange: (next: Set<string>) => void;
  options: MultiSelectOption[];
  /** Label chip glued to the left of the trigger (uppercase mono). */
  label: string;
  /** Optional icon rendered inside the trigger. */
  triggerIcon?: ReactNode;
  /** Adds a "Filter values…" input inside the popover. Use for the
   *  Topics popover (long lists); skip for Level (only 3 options). */
  searchable?: boolean;
  /** Trigger aria-label override (falls back to `label`). */
  ariaLabel?: string;
  id?: string;
}

/**
 * Project-wide multi-select dropdown. Wraps Radix Popover so we never
 * ship the browser-native UI and so every dropdown across the app
 * shares the same visual chrome (mono label chip + hard-edge trigger
 * + accent-on-focus). Pairs with Dropdown.tsx — that one handles
 * single-select, this one handles multi.
 *
 * Layout: trigger summarises selection count; popover holds the full
 * list with optional in-popover search, count badges per option, and
 * a footer "Clear" that empties this facet (doesn't close).
 *
 * Keyboard: arrow keys move focus across options (roving tabIndex),
 * Space toggles, Esc closes. Radix Popover doesn't provide list-nav,
 * so we implement it explicitly on each row.
 */
export default function MultiSelect({
  values,
  onChange,
  options,
  label,
  triggerIcon,
  searchable = false,
  ariaLabel,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [focusIdx, setFocusIdx] = useState(0);

  // Sort by count desc so "weighty" facets bubble up. Stable
  // alphabetical secondary sort keeps neighbours predictable.
  const sorted = useMemo(
    () =>
      [...options].sort(
        (a, b) => b.count - a.count || a.label.localeCompare(b.label),
      ),
    [options],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  // Reset the search field every time the popover closes so the next
  // open starts clean. Keep focus index in range as `filtered` shrinks.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setFocusIdx(0);
    }
  }, [open]);
  useEffect(() => {
    if (focusIdx >= filtered.length) setFocusIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, focusIdx]);

  function toggle(value: string) {
    const next = new Set(values);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  function clear() {
    if (values.size === 0) return;
    onChange(new Set());
  }

  function summary(): string {
    if (values.size === 0) return label;
    if (values.size === 1) {
      const only = [...values][0];
      const match = options.find((o) => o.value === only);
      return `${label}: ${match?.label ?? only}`;
    }
    return `${label}: ${values.size}`;
  }

  function onOptionKey(e: KeyboardEvent<HTMLDivElement>, idx: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(idx + 1, filtered.length - 1);
      setFocusIdx(next);
      optionRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(idx - 1, 0);
      setFocusIdx(next);
      optionRefs.current[next]?.focus();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle(filtered[idx].value);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          className="hz-dd hz-ms-trigger"
          aria-label={ariaLabel ?? label}
          data-active={values.size > 0 || undefined}
        >
          <span className="hz-dd-label">{label}</span>
          <span className="hz-dd-trigger hz-ms-trigger-body">
            {triggerIcon && <span className="hz-dd-tricon">{triggerIcon}</span>}
            <span className="hz-ms-value">{summary()}</span>
            <span className="hz-dd-caret">
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="hz-ms-content"
          align="start"
          sideOffset={6}
        >
          {searchable && (
            <label className="hz-ms-search">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                placeholder={`Filter ${label.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Filter ${label.toLowerCase()}`}
              />
            </label>
          )}
          <div className="hz-ms-viewport" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 ? (
              <div className="hz-ms-empty">No matches.</div>
            ) : (
              filtered.map((opt, idx) => {
                const checked = values.has(opt.value);
                return (
                  <div
                    key={opt.value}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    role="option"
                    aria-selected={checked}
                    tabIndex={idx === focusIdx ? 0 : -1}
                    className="hz-ms-option"
                    data-checked={checked || undefined}
                    onClick={() => toggle(opt.value)}
                    onKeyDown={(e) => onOptionKey(e, idx)}
                  >
                    <span className="hz-ms-check" aria-hidden="true">
                      {checked && <Check size={12} />}
                    </span>
                    <span className="hz-ms-label">{opt.label}</span>
                    <span className="hz-ms-count">{opt.count}</span>
                  </div>
                );
              })
            )}
          </div>
          {values.size > 0 && (
            <div className="hz-ms-footer">
              <button type="button" className="hz-ms-clear" onClick={clear}>
                <X size={12} aria-hidden="true" /> Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
