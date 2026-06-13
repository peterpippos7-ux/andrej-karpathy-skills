---
name: claude-codex-workflow
description: Orchestrate a Claude→Codex→Claude workflow. Claude structures the logic, architecture, or draft; Codex does the implementation legwork via `codex exec`; then Claude gives the result a once-over. Use when the user wants Claude to plan and review while delegating heavy implementation to Codex, or says things like "use codex to do the legwork", "design it then have codex build it", or "plan, delegate, review".
license: MIT
---

# Claude → Codex → Claude Workflow

A three-phase division of labor: **Claude is the architect and reviewer; Codex is the builder.** Claude does the thinking it's good at (decomposition, design, judgment) and the reviewing it's good at, and hands the mechanical implementation off to OpenAI's Codex CLI.

Use this for any non-trivial task where the work splits cleanly into "decide what to build" and "type out the build." For a one-line change, skip the ceremony and just do it.

## The three phases

### Phase 1 — Claude structures (architecture / logic / draft)

Don't delegate yet. First do the part that needs judgment:

- Restate the goal in one or two sentences so the target is explicit.
- Design the approach: architecture, data flow, key interfaces, edge cases, the logic. For a writing task, this is the outline/draft.
- Pin down constraints: files to touch (and to NOT touch), style to match, libraries already in use, how success is verified (tests, a command, expected output).
- Resolve ambiguity *now*. If two interpretations exist, ask the user before delegating — Codex can't ask follow-up questions.

Output of this phase is a **brief**: a self-contained spec Codex can execute without further context. Write it to a file so it's easy to pass and to diff against later:

```
.codex-brief.md   (or a temp file)
```

The brief should contain: the goal, the precise steps/changes, the constraints ("only touch X and Y", "match existing style", "don't add dependencies"), and the verification command. Be specific — vague briefs produce sprawling diffs.

### Phase 2 — Codex does the legwork

Hand the brief to Codex in non-interactive mode. Check it's installed first:

```bash
command -v codex || echo "codex not found — install: npm i -g @openai/codex (or brew install codex)"
```

If Codex is not installed, tell the user and offer to do the implementation yourself instead of blocking.

Run it headless from the project directory, feeding it the brief:

```bash
codex exec --full-auto -C "$PWD" \
  --output-last-message .codex-result.txt \
  "$(cat .codex-brief.md)"
```

- `exec` — non-interactive / headless mode (scriptable, no TUI).
- `--full-auto` — workspace-write sandbox with auto-approval, so Codex can edit files and run commands without prompting. In an already-sandboxed environment where that's still blocked, use `--dangerously-bypass-approvals-and-sandbox` instead (only when you're already inside a sandbox).
- `-C "$PWD"` — run against the current project.
- `--output-last-message <file>` — capture Codex's final summary to read back.
- Add `-m <model>` to pick a model, `--skip-git-repo-check` if the dir isn't a git repo.

Let Codex own the typing: creating/editing files, wiring things up, running the build. Don't micro-manage it mid-run — that's the whole point of delegating.

### Phase 3 — Claude gives it a once-over

Codex is done; now Claude reviews. **Do not rubber-stamp it.**

- Read the actual diff (`git diff`), not just Codex's summary.
- Check it against the Phase 1 brief: does it do what was specified, and *only* that? Flag scope creep, files touched that shouldn't have been, new dependencies, style drift.
- Run the verification: tests / linter / the command from the brief. Report real output — if it fails, say so.
- Look for the bugs Codex tends to leave: unhandled edge cases, half-wired interfaces, leftover scaffolding, assumptions that don't hold.
- Fix small issues directly. For anything structural or ambiguous, surface it to the user rather than silently reworking.

End with a short verdict: what Codex built, what you verified, and anything the user should know.

## Loop, don't one-shot

If Phase 3 finds real problems, don't hand-fix a large divergence — write a tighter follow-up brief and send Codex back in (Phase 2 again). Iterate: **structure → delegate → review → re-delegate** until the verification passes. Claude stays the architect and the gate; Codex stays the builder.

## Cleanup

Remove the scratch files when done:

```bash
rm -f .codex-brief.md .codex-result.txt
```

## When to skip this

- Trivial one-file, few-line changes — just do them.
- Tasks that are pure judgment with no legwork (a code review, a design discussion) — there's nothing to delegate.
- Codex unavailable and the user wants it done now — do the legwork yourself and say so.
