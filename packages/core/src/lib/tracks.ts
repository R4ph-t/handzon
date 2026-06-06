export interface TrackOption {
  id: string;
  label: string;
}

export interface ResolveTrackInput {
  tracks?: TrackOption[];
  explicitTrack?: string | null;
  preferredTrack?: string | null;
  defaultTrack?: string | null;
}

export function resolveActiveTrack({
  tracks = [],
  explicitTrack,
  preferredTrack,
  defaultTrack,
}: ResolveTrackInput): string | undefined {
  if (tracks.length === 0) return undefined;
  const ids = new Set(tracks.map((track) => track.id));
  if (explicitTrack && ids.has(explicitTrack)) return explicitTrack;
  if (preferredTrack && ids.has(preferredTrack)) return preferredTrack;
  if (defaultTrack && ids.has(defaultTrack)) return defaultTrack;
  return tracks[0]?.id;
}

export function trackStyleText(trackId: string | undefined): string {
  if (!trackId) return "";
  // Track ids are schema-limited to [a-z0-9_-], so a quoted attribute
  // selector is safe without relying on CSS.escape in older browsers.
  return `[data-track-panel]:not([data-track-panel="${trackId}"]) { display: none !important; }`;
}
