import type { MermaidConfig } from "mermaid";

/**
 * Browser-only helpers that derive a Mermaid configuration from the active
 * theme's CSS custom properties. Mermaid bakes colors into the rendered SVG
 * and runs color math (via khroma) on its theme variables, so we cannot hand
 * it raw `var(--token)` references or `oklch()` strings. Instead we read the
 * computed token values and normalize each to a hex/rgb string the renderer
 * can manipulate, then feed Mermaid's `base` theme so diagrams inherit the
 * site palette, fonts, and light/dark mode rather than Mermaid's stock theme.
 */

/**
 * Normalize any CSS color string (including `oklch()`) to a `#rrggbb` string.
 * We rasterize one pixel and read the bytes back rather than reading
 * `ctx.fillStyle`, because Chromium re-serializes `oklch()` as `oklch()` and
 * Mermaid's color library (khroma) only understands hex/rgb/hsl. Reading the
 * pixel forces a concrete sRGB value the renderer can manipulate. Returns the
 * fallback when the value is empty or the browser cannot parse it.
 */
function resolveColor(value: string, fallback: string): string {
  const input = value.trim();
  if (!input) return fallback;
  const ctx = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return fallback;
  // Seed with a sentinel; if the input is rejected the pixel stays this value.
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = input;
  if (ctx.fillStyle === "#ff00ff" && input.toLowerCase() !== "#ff00ff") {
    return fallback;
  }
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Relative luminance (0–1) of a `#rrggbb` color, for dark-mode detection. */
function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const int = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((int >> 16) & 0xff);
  const g = channel((int >> 8) & 0xff);
  const b = channel(int & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Build a Mermaid config from the document's active theme tokens. */
export function buildMermaidConfig(): MermaidConfig {
  const cs = getComputedStyle(document.documentElement);
  const token = (name: string) => cs.getPropertyValue(name).trim();
  const color = (name: string, fallback: string) =>
    resolveColor(token(name), fallback);

  const bg = color("--color-bg", "#0a0a0a");
  const surface = color("--color-surface", "#16181d");
  const surface2 = color("--color-surface-2", surface);
  const fg = color("--color-fg", "#f5f5f5");
  const muted = color("--color-muted", "#9ca3af");
  const border = color("--color-border", "#3a3a3a");
  const borderStrong = color("--color-border-strong", border);
  const accent = color("--color-accent", "#8b5cf6");
  const accentFg = color("--color-accent-fg", "#ffffff");

  const fontFamily =
    token("--font-sans") || "ui-sans-serif, system-ui, sans-serif";
  const darkMode = luminance(bg) < 0.5;

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily,
    themeVariables: {
      darkMode,
      background: surface,
      fontFamily,
      // Nodes
      primaryColor: surface2,
      primaryTextColor: fg,
      primaryBorderColor: accent,
      secondaryColor: surface,
      secondaryTextColor: fg,
      secondaryBorderColor: border,
      tertiaryColor: surface,
      tertiaryTextColor: fg,
      tertiaryBorderColor: border,
      mainBkg: surface2,
      nodeBorder: accent,
      nodeTextColor: fg,
      // Edges + general text
      lineColor: borderStrong,
      textColor: fg,
      titleColor: fg,
      edgeLabelBackground: surface,
      // Clusters / subgraphs
      clusterBkg: surface,
      clusterBorder: border,
      // Notes
      noteBkgColor: surface2,
      noteTextColor: fg,
      noteBorderColor: accent,
      // Sequence diagrams
      actorBkg: surface2,
      actorBorder: accent,
      actorTextColor: fg,
      actorLineColor: borderStrong,
      signalColor: fg,
      signalTextColor: fg,
      labelBoxBkgColor: surface2,
      labelBoxBorderColor: border,
      labelTextColor: fg,
      loopTextColor: fg,
      activationBkgColor: accent,
      activationBorderColor: accent,
      // Accent emphasis
      altBackground: surface,
      errorBkgColor: surface2,
      errorTextColor: muted,
      // Keep the accent legible where Mermaid fills with it.
      primaryColorText: accentFg,
    },
  };
}
