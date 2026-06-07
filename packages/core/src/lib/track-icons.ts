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
import type { TrackOption } from "./tracks";

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

export function iconForTrack(track: TrackOption): SimpleIcon | undefined {
  const id = track.id.toLowerCase();
  const label = track.label.toLowerCase();
  return TRACK_ICONS[id] ?? TRACK_ICONS[label];
}

export function fallbackTextForTrack(track: TrackOption): string {
  return (track.id || track.label).slice(0, 2).toUpperCase();
}
