import * as RadixTabs from "@radix-ui/react-tabs";
import { useEffect, useState, type ReactNode } from "react";

type TabItem = { label: string; value: string };

interface Props {
  items: TabItem[];
  group?: string;
  children: ReactNode;
}

const STORAGE_PREFIX = "tutorial-tool:tabs:";

export default function Tabs({ items, group, children }: Props) {
  const storageKey = group ? `${STORAGE_PREFIX}${group}` : null;
  const [value, setValue] = useState<string>(items[0]?.value ?? "");

  useEffect(() => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && items.some((i) => i.value === saved)) setValue(saved);
  }, [storageKey, items]);

  const onValueChange = (next: string) => {
    setValue(next);
    if (storageKey) window.localStorage.setItem(storageKey, next);
  };

  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className="tut-tabs">
      <RadixTabs.List className="tut-tabs-list">
        {items.map((item) => (
          <RadixTabs.Trigger key={item.value} value={item.value} className="tut-tabs-trigger">
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      <div className="tut-tabs-content">{children}</div>
    </RadixTabs.Root>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixTabs.Content value={value} className="tut-tab-panel">
      {children}
    </RadixTabs.Content>
  );
}
