export type TrackMap<T> = Record<string, T>;
export type TrackScoped<T> = T | TrackMap<T>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isStarterSpec(value: unknown): value is { kind: string } {
  return isRecord(value) && typeof value.kind === "string";
}

export function isVerifySpec(value: unknown): value is { id: string; checks: unknown[] } {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.checks);
}

export function resolveForTrack<T>(
  value: TrackScoped<T> | undefined,
  trackId: string | undefined,
  isShared: (v: unknown) => v is T,
): T | undefined {
  if (!value) return undefined;
  if (isShared(value)) return value;
  return trackId ? value[trackId] : undefined;
}
