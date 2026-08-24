# 6b6t website translations

Community-maintained translations for [6b6t.org](https://www.6b6t.org).

The English files in `locales/en` are the source text. Translate the matching
values in one of these folders:

- `locales/de` — German
- `locales/pl` — Polish
- `locales/ru` — Russian
- `locales/tr` — Turkish

Do not rename keys, files, or placeholders such as `{{players}}`. Automated
checks reject structural changes and broken placeholders. English text that has
not been translated yet may remain in place, so contributions can be submitted
one page at a time.

## Catalog layout

Most legacy page copy remains in focused files such as `home.json`,
`shop.json`, and `history.json`. The exhaustive `ui.json` catalog covers every
other detected website element and is divided into predictable sections:

- `pages` — route-specific content such as home, shop, account, stats, Legend,
  Hytale, and Horizon
- `shared` — navigation, footer, dialogs, galleries, accessibility labels, and
  reusable components
- `server` — messages that can reach the interface from APIs or shared services

Within those sections, keys are grouped by route and component filename. You
may translate one small component section at a time; a whole-language rewrite
is not required.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete workflow.
