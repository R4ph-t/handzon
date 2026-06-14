/**
 * Decide whether a completion item (quiz/checkpoint) counts toward the
 * current step given the active track.
 *
 * Items in shared prose live outside any `<Track>` panel (`panelTrack`
 * is null/undefined) and always count. Items inside a `<Track>` panel
 * only count when no track is active or they match the active track.
 * The only items excluded are those scoped to a *different* track.
 */
export function isItemInActiveTrack(
  panelTrack: string | null | undefined,
  activeTrack: string | null | undefined,
): boolean {
  if (!panelTrack) return true;
  if (!activeTrack) return true;
  return panelTrack === activeTrack;
}
