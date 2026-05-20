import * as p from "@clack/prompts";

/**
 * Typed wrapper around clack's prompt helpers. Centralises cancellation
 * so the rest of the CLI can pretend `ask()` always returns a value, and
 * removes the repetitive `opts.yes ? defaultValue : (await prompt(...) as
 * string)` ladder from the command files.
 */
export async function ask<T>(
  shouldPrompt: boolean,
  fallback: T,
  prompt: () => Promise<T | symbol>,
): Promise<T> {
  if (!shouldPrompt) return fallback;
  const result = await prompt();
  if (p.isCancel(result)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }
  return result as T;
}
