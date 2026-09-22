# Contributing a translation

1. Fork this repository and create a branch.
2. Choose one language folder under `locales`.
3. Edit only the text values. Keep JSON keys and file names unchanged.
4. Preserve placeholders exactly, including braces: `{{days}}` or
   `{{value1}}`. Placeholders may be moved to match natural word order.
5. Run `npm run check` with Node.js 24 or newer.
6. Open a pull request and name the language and page you translated.

You may translate one file or even a small group of strings. Leave unfinished
values in English; do not submit empty strings or machine-generated filler.

## Contribution Policy

**Scope.** One logical change per PR: a single feature, fix, or plugin. A PR may span several plugins or modules only when they implement one coherent cross-plugin feature; state that explicitly in the PR description. Unrelated changes belong in separate PRs.

**Base branch.** Every PR targets the default branch. PRs stacked on unmerged branches are rejected.

**Design first.** New shared libraries, cross-plugin systems, or architecture decisions need an approved issue before code is written.

**Upstream first.** Org-owned projects are not vendored. Changes to them go to the original project; a PR here must link the upstream change or issue.

**AI assistance.** Disclose AI-generated or AI-assisted code in the PR: which tool, and the approved issue it implements.

**Commit style.** Conventional Commits: `type(scope): description` (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert). CI enforces this on every PR.

**Evidence.** Build and test locally, and paste the evidence (commands run, logs, screenshots) in the PR.


## Writing guidelines

- Keep `6b6t`, Minecraft usernames, commands such as `/tpa`, URLs, and server
  addresses unchanged.
- Choose a focused `sections` group in one page file, `shared.json`, or
  `server.json`; do not attempt to translate technical keys.
- Translate naturally for players rather than word-for-word.
- Preserve the meaning and tone of the English source.
- Do not add promotions, links, claims, or instructions that are absent from
  the English text.

Accepted translations must be synchronized into the website repository before
its GitHub Actions production deployment. Merging here alone does not change
the running website; see the publishing steps in README.md.
