---
name: authoring-voice
description: Handzon's house voice and MDX-safe syntax for tutorials. Covers punctuation (no em dashes), MDX traps that break the build (attribute quoting, raw braces, lowercase tags), AI tells to cut, voice and POV conventions, word choices, and the code/prose interface. Use when writing or editing any tutorial body text, when prose feels "AI-ish", or when MDX build errors appear.
triggers: ["voice", "writing style", "tone check", "no em dashes", "em dash", "ai tells", "sound less ai", "rewrite to sound human", "style check", "house voice", "mdx error", "mdx syntax", "build failed mdx", "unexpected character mdx"]
---

Use this when you're writing tutorial prose, editing tutorial prose, or someone says "make this sound less AI". Other authoring skills (`add-tutorial`, `add-step`, `review-tutorial`) refer back here for voice — this is the single source of truth.

The Handzon voice is: **terse, direct, second-person, present-tense, concrete.** No filler. No hedging. No corporate buzzwords. The reader is busy and skeptical; earn their attention with substance.

## 1. Punctuation

- **No em dashes (`—`).** Ever. They're the single biggest AI tell. Replace with a period, a colon, parentheses, or a hyphen with spaces (` - `).
  - Bad: *"This is the easy part — and the most important."*
  - Good: *"This is the easy part. It's also the most important."*
  - Good: *"This is the easy part (and the most important)."*
- **No en dashes (`–`) for ranges in prose.** Use "to" or a hyphen. Number ranges in tables/specs can keep en dashes if they're already there.
- **No stylistic ellipses (`…` or `...`)** to imply "and so on" or trailing thought. Finish the sentence.
- **Semicolons are fine but rare.** If you're reaching for one, you probably want two sentences.
- **Oxford commas, always.** In a list of three or more, comma before the final "and".
- **Backtick all identifiers, file paths, commands, and option values** in prose. `useState`, `pnpm dev`, `_meta.json`, `gated: true`.

## 2. MDX safety (don't break the build)

MDX is JSX inside Markdown. JSX is strict about syntax in a way Markdown isn't, and a few patterns reliably break the build with errors like ``Unexpected character `\` (U+005C) in attribute name``. Avoid them.

- **No backslash-escaped quotes inside JSX attributes.** Attribute strings don't support C-style escapes. `\"` ends the string and leaves a stray `\`, which throws the parser. To include a double quote in a string attribute, use one of these:
  - Single quotes on the outside: `label='My API returns {"status":"ok"}.'`
  - A JSX expression: ``label={`My API returns {"status":"ok"}.`}``
  - HTML entity: `label="My API returns {&quot;status&quot;:&quot;ok&quot;}."`
  - Avoid the inner quote entirely: `label="My API returns status:ok."`

- **No raw `{` or `}` in prose** outside code blocks or fenced code. MDX reads `{...}` as a JSX expression and will fail or render junk. Wrap in backticks (inline code), put inside a fenced code block, or escape with `\{` and `\}`.
  - Broken: `The response is {"status": "ok"}.`
  - Good: ``The response is `{"status": "ok"}` in JSON.``
  - Good: `The response is \{"status": "ok"\} in JSON.`

- **No raw `<` followed by a lowercase letter or digit** in prose. MDX parses it as the start of a tag. Wrap in backticks or use `&lt;`.
  - Broken: `Use this when x < 5.`
  - Good: ``Use this when `x < 5`.``
  - Good: `Use this when x &lt; 5.`

- **Component names must start with uppercase.** `<Quiz>` works; `<quiz>` is treated as an HTML element and any custom props are ignored.

- **Self-close empty components.** `<Checkpoint label="..." />` not `<Checkpoint label="...">`. Missing `/>` makes everything after it the component's children, often producing wildly misleading errors many lines later.

- **Use JSX comments, not HTML comments.** `{/* this is a comment */}` is hidden from output. `<!-- this is rendered as text -->` is not.

- **Leave blank lines around multi-line JSX blocks.** MDX can confuse JSX that hugs prose paragraphs. Always:
  - Blank line before the opening tag if the tag is on its own line.
  - Blank line after the closing tag if more prose follows.

- **Frontmatter is YAML, three dashes, at the very top.** No blank lines or BOM before it. No tabs in YAML indentation (YAML rejects tabs).

- **When showing MDX as example code inside a step**, wrap it in a fenced code block tagged as `mdx`. Otherwise the parser tries to render the example as live JSX.

- **`style={{...}}` needs double braces.** The outer `{}` is the JSX expression; the inner `{}` is the object literal. Single braces will parse the contents as an expression and almost always fail.

When the build fails with an MDX error, the error message includes a line number. Open that line first — the cause is almost always one of the above. If it's not, run `pnpm check` and read the full diagnostic.

## 3. AI tells to cut

These phrases scream "an LLM wrote this". Delete them — they almost never add information.

| Cut                                             | Why                                               |
| ----------------------------------------------- | ------------------------------------------------- |
| "Let's dive into…"                              | Just start.                                       |
| "In this section, we'll explore…"               | The heading already says it.                     |
| "It's important to note that…"                  | If it's important, just say the thing.            |
| "It's worth mentioning…"                        | Same.                                             |
| "Whether you're a beginner or an expert…"       | Empty preamble. Cut.                              |
| "comprehensive", "robust", "seamless"           | Marketing words. Show, don't claim.               |
| "leverage", "utilize"                           | Use "use".                                        |
| "delve into", "deep dive", "unpack"             | Just say what you're doing.                       |
| "elegant", "powerful", "best-in-class"          | Adjectives the reader should decide for themselves. |
| "In conclusion…", "To wrap up…"                 | `<Recap>` already does this.                      |
| "Imagine a world where…"                        | Don't.                                            |
| "Furthermore", "Moreover", "Additionally"       | Usually replaceable with "Also" or a period.      |
| Excessive hedging: "perhaps", "might", "could"  | Be direct. If you're not sure, say "I'm not sure". |

## 4. Voice & POV

- **Second person.** Address the reader directly: "you write", "you'll see", "your terminal shows". Not "the user" or "one might".
- **Present tense for instructions.** "Run `pnpm dev`." Not "You will need to run `pnpm dev`."
- **Imperative for step actions.** "Open `App.tsx`." Not "Now, you should open `App.tsx`."
- **Active voice.** "The component renders the list." Not "The list is rendered by the component."
- **Singular "you" + singular verb.** Don't switch to "we" mid-tutorial (it's not a group effort).
- **Don't apologize for the tutorial.** Cut "this might be confusing but…" and "don't worry if this doesn't make sense yet". If it might be confusing, fix the explanation.

## 5. Word choices

Prefer the shorter, plainer word.

| Prefer        | Avoid              |
| ------------- | ------------------ |
| use           | utilize, leverage  |
| help          | facilitate         |
| set up        | provision, configure (when "set up" fits) |
| start         | initialize, kick off |
| tool          | solution           |
| run           | execute            |
| show          | display, surface (often) |
| try           | attempt            |
| make sure     | ensure (often)     |
| because       | due to the fact that |
| about         | approximately, regarding |
| now           | at this point, at this time |
| click         | click on           |

These aren't absolute rules — if the longer word is more precise, use it. The defaults just bias toward plainness.

## 6. Code-prose interface

The hardest line to walk is between code blocks and the prose around them. Rules:

- **Don't restate what a code block says.** If the next line of prose is "this code creates a state variable", delete it — the reader can see that.
- **Do explain *why*** in prose, not what. "The setter triggers a re-render" is useful; "we call `setCount`" is not.
- **Don't introduce a code block with "below" or "the following".** Just write the prose, then the code. The proximity is enough.
- **Backtick everything that is code in prose.** Filenames, identifiers, commands, npm packages, environment variables.
- **Don't paraphrase code.** If the reader needs to see exact syntax, show it. Don't say "you'd call `useState` with the initial value" — show the call.
- **Show output where it matters.** Use `<Terminal entries={[{command, output}]}>` for commands whose output is part of the lesson; don't just describe what the reader should see.

## 7. Sentence and paragraph shape

- **Short sentences.** Median around 15 words. If a sentence has more than one comma in the middle, consider splitting.
- **One idea per paragraph.** If you can't summarize the paragraph in 5 words, it's doing too much.
- **Lead with the verb.** "Run the migration." Not "The next thing to do is run the migration."
- **Don't fear repetition** if it aids clarity. Pronouns ("it", "this", "that") in technical prose are often ambiguous; repeat the noun.

## 8. Working examples

**Before** (AI-ish):

> Now that we've successfully set up our environment, let's dive into the exciting world of state management. In this section, we'll explore how to leverage React's useState hook to create a robust counter component — a fundamental building block of any modern application.

**After** (Handzon voice):

> You have an environment. Time to add state.
>
> The `useState` hook gives a component a value and a setter that re-renders the component when called. Build a counter to see it work.

Cuts: "successfully", "let's dive into", "exciting world", "explore", "leverage", "robust", "fundamental building block", "any modern application", the em dash, the bloat. What's left says more in a third of the words.

## Don't

- Don't use em dashes. This is the one rule with no exceptions.
- Don't write a preamble to a section. Start with the substance.
- Don't apologize for the tutorial's difficulty mid-flow. Fix the explanation instead.
- Don't switch between "you" and "we". Pick "you" and stay there.
- Don't paraphrase code in prose. Show the code, then explain *why*.
- Don't write marketing-style adjectives ("powerful", "robust", "elegant"). The reader will form their own opinion.
- Don't write "in conclusion". That's what `<Recap>` is for.
- Don't escape quotes inside JSX attributes with `\"`. Use single quotes on the outside, a JSX expression, or `&quot;`. This is the most common build break.
- Don't write raw `{` or `}` in prose outside code blocks. They're parsed as JSX expressions.
- Don't worry about formal vs. casual tone. Worry about whether each sentence carries weight.
