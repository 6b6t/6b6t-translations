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

After a translation pull request is reviewed and merged, redeploy the website
in Dokploy. The website build downloads this repository's latest `main` commit,
validates every catalog and placeholder, and compiles the accepted translations
into the deployment. No website sync pull request or Git submodule update is
required.
