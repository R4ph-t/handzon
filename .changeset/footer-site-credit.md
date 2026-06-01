---
"handzon-core": minor
---

Overridable footer. The footer is no longer a hardcoded "Built with Handzon" line:

- The default `Footer` now accepts optional `siteUrl` and `siteCreditLabel` props (threaded from page wrappers and `BaseLayout`). When `siteUrl` is set, the footer leads with the site owner's credit — `© {year} {siteCreditLabel ?? siteName}` linked to `siteUrl` — and demotes "Built with Handzon" to a quieter secondary link on the side. Omit `siteUrl` and the footer is unchanged, so existing scaffolds keep their current footer.
- `showFooter` is now threaded through every page wrapper (`Home`, `TutorialLanding`, `TutorialStep`, `TutorialLayout`), so a scaffold can pass `showFooter={false}` to drop the built-in footer entirely and render its own markup for full control.
