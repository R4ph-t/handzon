import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { dispatchAssist, useAiEnabled } from "../../lib/ai/assist";

/** Minimum selection length before the affordance appears. Avoids
 * flashing on stray clicks or accidental drag-selects of one word.
 */
const MIN_CHARS = 8;

interface Anchor {
  top: number;
  left: number;
  text: string;
}

/**
 * Listens for text selection inside <article.prose> (the tutorial
 * step body). When a non-trivial selection lands, renders a small
 * floating button anchored just above the selection range that
 * opens the chat with a "selection" intent.
 *
 * Mounted once per page by TutorialStep alongside ChatButton. Hides
 * itself entirely when the in-app tutor isn't enabled.
 */
export default function SelectionAsk() {
  const enabled = useAiEnabled();
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    if (!enabled) return;
    function onMouseUp() {
      // Defer one frame so the selection is finalized before we read it.
      window.requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setAnchor(null);
          return;
        }
        const text = sel.toString().trim();
        if (text.length < MIN_CHARS) {
          setAnchor(null);
          return;
        }
        const range = sel.getRangeAt(0);
        // Only show inside <article.prose>; everywhere else (sidebar,
        // chat, header) selections are not tutor-relevant.
        const article = (range.commonAncestorContainer as Node).parentElement?.closest(
          "article.prose",
        );
        if (!article) {
          setAnchor(null);
          return;
        }
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setAnchor(null);
          return;
        }
        setAnchor({
          top: window.scrollY + rect.top - 36,
          left: window.scrollX + rect.left + rect.width / 2,
          text,
        });
      });
    }
    function onScroll() {
      setAnchor(null);
    }
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setAnchor(null);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  if (!enabled || !anchor) return null;

  return (
    <button
      type="button"
      className="hz-selection-ask"
      style={{ top: anchor.top, left: anchor.left, transform: "translateX(-50%)" }}
      onClick={() => {
        dispatchAssist({ kind: "selection", text: anchor.text });
        setAnchor(null);
        window.getSelection()?.removeAllRanges();
      }}
    >
      <Sparkles size={12} aria-hidden="true" />
      <span>Ask about this</span>
    </button>
  );
}
