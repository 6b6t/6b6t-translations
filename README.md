# 6b6t website translations

Community-maintained translations for [6b6t.org](https://www.6b6t.org).

The English files in `locales/en` are the source text. Translate the matching
values in one of these folders:

- `locales/de` — German
- `locales/es` — Spanish
- `locales/fr` — French
- `locales/hi` — Hindi
- `locales/pl` — Polish
- `locales/ru` — Russian
- `locales/tr` — Turkish

Do not rename keys, files, or placeholders such as `{{players}}`. Automated
checks reject structural changes and broken placeholders. English text that has
not been translated yet may remain in place, so contributions can be submitted
one page at a time.

## Catalog layout

Each website page has its own complete file. For example, `home.json` contains
the homepage hero, features, gallery, partners, statistics, videos, FAQ, and
all other homepage content. `shop.json`, `legend.json`, `hytale.json`, and the
other page files follow the same pattern.

Inside a page file, generated website copy is grouped under `sections` by the
component or area that displays it. Existing direct translation keys may appear
before `sections` in older page files; they are also active and must remain.

- `shared.json` — navigation, footer, dialogs, galleries, accessibility labels,
  and reusable components
- `server.json` — messages that can reach the interface from APIs or shared
  services

You may translate one small section at a time; a whole-language rewrite is not
required.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete workflow.

## Publishing accepted translations

After a translation pull request is reviewed and merged, synchronize the catalogs
in the website repository with `bun run translations:sync /path/to/6b6t-translations/locales`.
Verify and commit that change to the website's `main` branch. Its GitHub Actions
workflow deploys the committed catalogs to Cloudflare, without fetching this
repository during CI.

Local website builds can still fetch this repository's latest `main` unless
`SKIP_COMMUNITY_TRANSLATIONS_FETCH=true` is set. The English source must match
the website exactly. When the website source changes, export it with
`bun run translations:export-source /path/to/6b6t-translations/locales`, preserve
any newer translations already in the website, then validate both repositories.

## Local Git checks

Install [Lefthook](https://lefthook.dev/installation/) 1.13.6 or newer and Python 3.10 or newer.
Run this command once in each clone or linked worktree:

```bash
lefthook install
```

The commit hook checks staged whitespace without changing files or staging content.
Before a push, the hook reads Git's exact ref updates and selects checks from the changed paths, including deleted files.
New refs and unavailable remote baselines check the complete tree.
Check out the commit that you push. Commit or stash tracked and untracked changes first so that checks use the pushed code.
Deletion-only pushes do not run code checks. Hook regression tests run for every push with changed files.
Documentation-only changes do not compile the application. CI remains enabled.

Install Node.js 24 or newer and npm, then run `npm ci`.
Locale, validator, and package changes run `npm run check` for all locales.
The validator checks key structure, value types, empty translations, array lengths, and placeholders.
The validator and seed scripts are TypeScript files in `scripts/`. Node.js runs them directly.
The same command then runs Oxlint, which also type-checks the scripts, and checks formatting with Oxfmt. Run `npm run format` to fix formatting.
The hook does not seed, rewrite, or stage translations.

Preview all local checks and their selected paths:

```bash
python3 scripts/check-push.py --all --dry-run --verbose
```

Run all checks against the current working tree before committing:

```bash
python3 scripts/check-push.py --all
```

The `--all` command checks working files directly. It does not require a clean tree.
Normal Git pushes require a clean tree and reject a ref that points to another commit.
