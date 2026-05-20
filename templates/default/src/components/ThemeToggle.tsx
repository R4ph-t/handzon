import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useProgress } from "~/lib/progress/useProgress";

export default function ThemeToggle() {
  const { state, setPref } = useProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const preferred =
      state.prefs.theme ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", preferred);
  }, [state.prefs.theme]);

  function toggle() {
    const next = (state.prefs.theme ?? "dark") === "dark" ? "light" : "dark";
    setPref("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (!mounted) return <button type="button" className="theme-toggle" aria-label="Toggle theme" />;

  const current = state.prefs.theme ?? "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${current === "dark" ? "light" : "dark"} mode`}
    >
      {current === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
