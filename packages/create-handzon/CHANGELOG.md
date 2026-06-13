# create-handzon

## 0.9.1

### Patch Changes

- 560e9e3: Add a Starlight documentation site and make generated project agent guidance point to the canonical docs.

## 0.9.0

### Minor Changes

- ffb5c0d: Add first-class tutorial tracks for programming-language variants.

  Tutorial authors can now declare `tracks`, use `<Track>` blocks for track-specific content, and provide per-track `starter` and `verify` specs. The learner's selected track is persisted, used by MCP starter and verification tools, and passed into AI context so the tutor sees only active-track content. The default scaffold now documents tracks and includes a multi-track sample tutorial.
