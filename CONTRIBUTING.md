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

## Writing guidelines

- Keep `6b6t`, Minecraft usernames, commands such as `/tpa`, URLs, and server
  addresses unchanged.
- Choose a focused `sections` group in one page file, `shared.json`, or
  `server.json`; do not attempt to translate technical keys.
- Translate naturally for players rather than word-for-word.
- Preserve the meaning and tone of the English source.
- Do not add promotions, links, claims, or instructions that are absent from
  the English text.

The website imports accepted translations through a review-only pull request.
A merged translation never deploys directly to production.
