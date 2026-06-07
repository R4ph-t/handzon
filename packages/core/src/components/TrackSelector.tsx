import { useEffect, useMemo } from "react";
import { useProgress } from "../lib/progress/useProgress";
import { fallbackTextForTrack, iconForTrack } from "../lib/track-icons";
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
                  {fallbackTextForTrack(track)}
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
