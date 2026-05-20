import { readFile, writeFile } from "node:fs/promises";

/**
 * Replace __PROJECT_NAME__ in a file with the user-supplied project name.
 * Skips silently if the file doesn't exist.
 */
export async function replaceProjectName(path: string, name: string): Promise<void> {
  let body: string;
  try {
    body = await readFile(path, "utf8");
  } catch {
    return;
  }
  const next = body.replaceAll("__PROJECT_NAME__", name);
  if (next !== body) await writeFile(path, next, "utf8");
}
