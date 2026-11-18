import { Effect } from "effect";

import { nodeCatalogFilesLayer, reportTranslationValidation } from "./translations.ts";

process.exitCode = await Effect.runPromise(
  reportTranslationValidation(process.argv[2] ?? "locales").pipe(
    Effect.provide(nodeCatalogFilesLayer),
  ),
);
