import { useEffect, useState } from "react";

/**
 * Client-only auth menu. Fetches `/api/auth/session` + `/api/auth/csrf`
 * on mount and renders either:
 *  - signed-out: a "Sign in with GitHub" form-post button
 *  - signed-in:  avatar + name + sign-out icon button
 *  - nothing:    if the auth-astro integration isn't wired (the
 *                endpoints 404), so dropping handzon-core into a Tier-1
 *                scaffold doesn't surface dead UI
 *
 * Lives as a `client:only="react"` island instead of an Astro component
 * so it works on prerendered pages too — Astro warns whenever a
 * prerendered route accesses `Astro.request.headers`, which the old
 * server-rendered UserMenu did transitively via auth-astro's
 * `getSession`. With the data fetched on the client there's no SSR
 * dependency on request state at all.
 */

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
interface Session {
  user?: SessionUser;
}

const GITHUB_ICON_PATH =
  "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.02c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.76 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.37-5.25 5.65.41.35.78 1.04.78 2.11v3.13c0 .3.21.66.79.55C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z";

export default function UserMenu() {
  // `undefined` = not yet loaded; `null` = no auth or signed out;
  // object = signed in. The tri-state avoids flashing the sign-in
  // button while the session fetch is in flight.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessRes, csrfRes] = await Promise.all([
          fetch("/api/auth/session", { credentials: "same-origin" }),
          fetch("/api/auth/csrf", { credentials: "same-origin" }),
        ]);
        if (cancelled) return;
        // 404 → auth-astro integration not wired in this scaffold.
        if (!sessRes.ok || !csrfRes.ok) {
          setSession(null);
          setCsrfToken(null);
          return;
        }
        const sess = (await sessRes.json()) as Session | null;
        const csrf = (await csrfRes.json()) as { csrfToken?: string } | null;
        setSession(sess?.user ? sess : null);
        setCsrfToken(csrf?.csrfToken ?? null);
      } catch {
        if (!cancelled) {
          setSession(null);
          setCsrfToken(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading or auth not wired → render nothing.
  if (session === undefined || !csrfToken) return null;

  const user = session?.user;
  const callbackUrl = typeof window !== "undefined" ? window.location.href : "/";

  // Compact label for the topbar: first word of `name`, falling back
  // to the local part of `email`, falling back to a generic. Full name
  // / email stays in the `alt` text and `title` for accessibility +
  // long-form context.
  const fullLabel = user?.name ?? user?.email ?? "Signed in";
  const displayName = user
    ? ((user.name ? user.name.trim().split(/\s+/)[0] : null) ??
      (user.email ? user.email.split("@")[0] : null) ??
      "Signed in")
    : "";

  return (
    <div className="user-menu">
      {user ? (
        <>
          {user.image ? (
            <img className="um-avatar" src={user.image} alt={fullLabel} />
          ) : (
            <span className="um-avatar um-avatar-fallback" aria-hidden="true">
              {fullLabel.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className="um-name" title={fullLabel}>
            {displayName}
          </span>
          <form method="post" action="/api/auth/signout">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button type="submit" className="um-btn um-btn-icon" title="Sign out">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </>
      ) : (
        <form method="post" action="/api/auth/signin/github">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button type="submit" className="um-btn">
            <svg
              className="um-gh"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={GITHUB_ICON_PATH} />
            </svg>
            <span>Sign in with GitHub</span>
          </button>
        </form>
      )}
    </div>
  );
}
