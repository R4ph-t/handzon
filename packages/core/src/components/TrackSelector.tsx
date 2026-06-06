import { useEffect, useMemo } from "react";
import {
  type SimpleIcon,
  siC,
  siCplusplus,
  siGnubash,
  siGo,
  siJavascript,
  siMysql,
  siPhp,
  siPostgresql,
  siPython,
  siRuby,
  siRust,
  siSqlite,
  siTypescript,
} from "simple-icons";
import { useProgress } from "../lib/progress/useProgress";
import { resolveActiveTrack, type TrackOption, trackStyleText } from "../lib/tracks";

interface Props {
  tracks: TrackOption[];
  defaultTrack?: string;
}

function applyTrackStyle(trackId: string | undefined) {
  if (typeof document === "undefined" || !trackId) return;
  document.documentElement.dataset.track = trackId;
  let style = document.getElementById("handzon-track-style") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "handzon-track-style";
    document.head.appendChild(style);
  }
  style.textContent = trackStyleText(trackId);
}

const TRACK_ICONS: Record<string, SimpleIcon> = {
  bash: siGnubash,
  c: siC,
  "c++": siCplusplus,
  cpp: siCplusplus,
  go: siGo,
  js: siJavascript,
  javascript: siJavascript,
  mysql: siMysql,
  php: siPhp,
  postgres: siPostgresql,
  postgresql: siPostgresql,
  py: siPython,
  python: siPython,
  rb: siRuby,
  ruby: siRuby,
  rust: siRust,
  sqlite: siSqlite,
  ts: siTypescript,
  typescript: siTypescript,
};

function iconForTrack(track: TrackOption): SimpleIcon | undefined {
  const id = track.id.toLowerCase();
  const label = track.label.toLowerCase();
  return TRACK_ICONS[id] ?? TRACK_ICONS[label];
}

function fallbackText(track: TrackOption): string {
  return (track.id || track.label).slice(0, 2).toUpperCase();
}

export default function TrackSelector({ tracks, defaultTrack }: Props) {
  const { state, setPref } = useProgress();
  const activeTrack = useMemo(
    () =>
      resolveActiveTrack({
        tracks,
        preferredTrack: state.prefs.track,
        defaultTrack,
      }),
    [tracks, state.prefs.track, defaultTrack],
  );

  useEffect(() => {
    applyTrackStyle(activeTrack);
  }, [activeTrack]);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-track-fallback]").forEach((el) => {
      el.hidden = true;
    });
  }, []);

  if (tracks.length < 2 || !activeTrack) return null;

  return (
    <section className="track-selector" aria-label="Tutorial track">
      <div className="track-selector-list">
        {tracks.map((track) => {
          const selected = track.id === activeTrack;
          const icon = iconForTrack(track);
          return (
            <button
              type="button"
              key={track.id}
              className="track-selector-option"
              data-active={selected ? "true" : "false"}
              aria-pressed={selected}
              onClick={() => setPref("track", track.id)}
            >
              {icon ? (
                <svg className="track-selector-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={icon.path} />
                </svg>
              ) : (
                <span className="track-selector-fallback" aria-hidden="true">
                  {fallbackText(track)}
                </span>
              )}
              <span>{track.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
