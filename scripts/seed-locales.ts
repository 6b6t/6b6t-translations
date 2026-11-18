import { Effect } from "effect";

import { nodeCatalogFilesLayer, seedLocales } from "./translations.ts";

await Effect.runPromise(seedLocales("locales").pipe(Effect.provide(nodeCatalogFilesLayer)));
