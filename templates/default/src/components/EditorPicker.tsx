import { useEffect, useState } from "react";
import Dropdown, { type DropdownOption } from "handzon-core/components/ui/Dropdown.tsx";

/**
 * Picker control for /settings/tokens. Wraps the project-wide Dropdown
 * (Radix Select) so we never ship the native OS popup. Renders twice on
 * the page (post-mint success card + persistent reference) and keeps the
 * two instances in sync via a CustomEvent on the document.
 *
 * Side-effect: toggles `[hidden]` on every `.editor-panel[data-editor]`
 * on the page whenever the value changes. The Astro partial server-
 * renders every panel; this island is what shows/hides them.
 */

const STORAGE_KEY = "handzon-editor-pick";
const CHANGE_EVENT = "handzon-editor-change";

interface Props {
  options: DropdownOption[];
  defaultValue?: string;
}

function applyPanelVisibility(value: string): void {
  for (const panel of document.querySelectorAll<HTMLElement>(".editor-panel")) {
    panel.toggleAttribute("hidden", panel.dataset.editor !== value);
  }
  // Per-panel <h4> labels are a no-JS fallback only — once this island
  // hydrates the dropdown announces the current panel, so collapse them
  // unconditionally. Done in JS (not CSS) because Astro's per-component
  // style scoping makes a `body:has(.hz-dd) .editor-label` rule miss the
  // partial's labels when declared in tokens.astro's stylesheet.
  for (const label of document.querySelectorAll<HTMLElement>(".editor-label")) {
    label.hidden = true;
  }
}

export default function EditorPicker({ options, defaultValue = "cursor" }: Props) {
  const [value, setValue] = useState<string>(defaultValue);

  // First paint: read persisted choice, apply visibility for our own panel
  // set. Runs once per instance — if there are two pickers on the page,
  // both read storage and both apply visibility (idempotent).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial =
      stored && options.some((o) => o.value === stored) ? stored : defaultValue;
    setValue(initial);
    applyPanelVisibility(initial);
  }, []);

  // Cross-instance sync: when the OTHER picker on the page changes, mirror
  // it here so the dropdowns don't disagree. Skip the event we just fired
  // ourselves (state would already match).
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<{ value: string }>).detail.value;
      if (next !== value) setValue(next);
    };
    document.addEventListener(CHANGE_EVENT, handler);
    return () => document.removeEventListener(CHANGE_EVENT, handler);
  }, [value]);

  function onChange(next: string): void {
    setValue(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyPanelVisibility(next);
    document.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: { value: next } }),
    );
  }

  return (
    <Dropdown
      label="Install in"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
