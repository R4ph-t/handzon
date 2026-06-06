const TRACK_BLOCK =
  /<Track\b[^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})[^>]*>([\s\S]*?)<\/Track>/g;

export function stripInactiveTrackBlocks(source: string, activeTrack: string | undefined): string {
  if (!activeTrack) return source;
  return source.replace(TRACK_BLOCK, (_full, doubleId, singleId, templateId, body) => {
    const id = doubleId ?? singleId ?? templateId;
    return id === activeTrack ? String(body).trim() : "";
  });
}
