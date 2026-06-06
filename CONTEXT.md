# Handzon

Handzon is a generator for file-based, MDX tutorial sites: authors write tutorials as content, learners work through steps, and an optional MCP bridge lets a local agent run and verify their work.

## Language

**Tutorial**:
A self-contained learning unit, stored as a directory of MDX steps plus a `_meta.json`. Has no database row; content lives on the filesystem.

**Step**:
A single page within a tutorial, parsed from an `NN-slug.mdx` file.

**Track**:
A programming-language variant of a single tutorial (for example, the "Python track" vs the "TypeScript track"). One tutorial declares its tracks; the learner picks one (a single global, persisted choice) and the snippets, verify checks, and starter resolve to that track. Progress is shared across tracks.
_Avoid_: lang, language, variant (for this concept).

**Active track**:
The track currently resolved for a learner: explicit choice > persisted `prefs.track` (when offered by this tutorial) > tutorial `defaultTrack` > first declared track.

**Lang**:
A fence-level syntax identifier used only for Shiki highlighting (` ```ts `, ` ```sql `) and the AI code-block filter. Not the learner's chosen variant — a bash fence can appear inside the Python track.
_Avoid_: using "lang" to mean Track.

**Checkpoint**:
A self-attested "I did X" marker in a step, identified by an `id`. Shared across tracks.

**Verify**:
A machine-checkable spec (file/shell/http checks) attached to a step's checkpoint, run by the local agent and scored server-side.

**Starter**:
The bootstrap for a tutorial's workspace — either a `git` demo repo to clone or a `command` to scaffold. The "linked demo repo."

## Flagged ambiguities

- **lang vs Track**: `lang` (fence syntax / AI filter) and Track (learner's chosen variant) are distinct. Resolved: keep `lang` for fences, introduce `track` for variants.
