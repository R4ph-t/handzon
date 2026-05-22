import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

export interface DropdownOption<V extends string = string> {
  value: V;
  label: string;
  /** Optional leading glyph rendered before the label inside the item. */
  icon?: ReactNode;
}

export interface DropdownProps<V extends string = string> {
  value: V;
  onChange: (value: V) => void;
  options: DropdownOption<V>[];
  /** Visible label glued to the left of the trigger (uppercase mono chip). */
  label?: string;
  /** Optional leading icon rendered inside the trigger before the label. */
  triggerIcon?: ReactNode;
  /** aria-label for the trigger when no `label` is shown. */
  ariaLabel?: string;
  /** Placeholder shown when `value` doesn't match any option. */
  placeholder?: string;
  /** Extra class on the outer wrapper for layout tweaks. */
  className?: string;
  id?: string;
}

/**
 * Project-wide dropdown. Wraps Radix Select so we never ship the native
 * browser dropdown UI — those look out-of-place against the brutalist
 * mono/hard-edge palette and vary wildly across OSes. Every new select
 * in handzon-core should use this; do not introduce raw `<select>`.
 */
export default function Dropdown<V extends string = string>({
  value,
  onChange,
  options,
  label,
  triggerIcon,
  ariaLabel,
  placeholder,
  className,
  id,
}: DropdownProps<V>) {
  return (
    <div className={`hz-dd${className ? ` ${className}` : ""}`}>
      {label && (
        <span className="hz-dd-label" id={id ? `${id}-label` : undefined}>
          {label}
        </span>
      )}
      <Select.Root value={value} onValueChange={(v) => onChange(v as V)}>
        <Select.Trigger
          id={id}
          className="hz-dd-trigger"
          aria-label={ariaLabel ?? label}
          aria-labelledby={label && id ? `${id}-label` : undefined}
        >
          {triggerIcon && <span className="hz-dd-tricon">{triggerIcon}</span>}
          <Select.Value placeholder={placeholder ?? "Select…"} />
          <Select.Icon className="hz-dd-caret">
            <ChevronDown size={14} aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="hz-dd-content" position="popper" sideOffset={6}>
            <Select.ScrollUpButton className="hz-dd-scroll">
              <ChevronUp size={14} aria-hidden="true" />
            </Select.ScrollUpButton>
            <Select.Viewport className="hz-dd-viewport">
              {options.map((opt) => (
                <Select.Item key={opt.value} value={opt.value} className="hz-dd-item">
                  {opt.icon && <span className="hz-dd-icon">{opt.icon}</span>}
                  <Select.ItemText>{opt.label}</Select.ItemText>
                  <Select.ItemIndicator className="hz-dd-check">
                    <Check size={14} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="hz-dd-scroll">
              <ChevronDown size={14} aria-hidden="true" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
