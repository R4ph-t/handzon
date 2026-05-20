/**
 * Thin wrapper around `auth-astro/server`'s `getSession` that flattens
 * the shape into something boring and stable. Callers don't need to
 * know about Auth.js's JWT vs database session details.
 */
import { getSession } from "auth-astro/server";

export interface AuthedUser {
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

export async function getAuthedUser(request: Request): Promise<AuthedUser | null> {
  const session = await getSession(request);
  const user = session?.user as
    | { id?: string; email?: string | null; name?: string | null; image?: string | null }
    | undefined;
  if (!user?.id) return null;
  return {
    userId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}
