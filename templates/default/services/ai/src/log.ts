/**
 * Minimal structured logger. Emits one JSON line per call to stdout,
 * which Render's log explorer parses into structured fields. Keeps the
 * AI service free of a real log dep (pino/winston) for now — swap in
 * later if/when log shipping or sampling matters.
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...(fields ?? {}),
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};
