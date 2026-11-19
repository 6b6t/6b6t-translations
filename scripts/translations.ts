import { constants } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { Console, Context, Data, Effect, Layer, Option, Predicate, Result } from "effect";

export const SOURCE_LOCALE = "en";
export const TRANSLATED_LOCALES = ["de", "es", "fr", "hi", "pl", "ru", "tr"] as const;
export const ALL_LOCALES = [SOURCE_LOCALE, ...TRANSLATED_LOCALES] as const;
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/gu;

function hasErrorCode(cause: unknown, code: string): boolean {
  return Predicate.hasProperty(cause, "code") && cause.code === code;
}

function causeMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export class CatalogDirectoryError extends Data.TaggedError("CatalogDirectoryError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `${this.path}: directory is unavailable (${causeMessage(this.cause)})`;
  }
}

export class CatalogReadError extends Data.TaggedError("CatalogReadError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `${this.path}: file is unreadable (${causeMessage(this.cause)})`;
  }
}

export class CatalogJsonError extends Data.TaggedError("CatalogJsonError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `${this.path}: invalid JSON (${causeMessage(this.cause)})`;
  }
}

export class CatalogWriteError extends Data.TaggedError("CatalogWriteError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `${this.path}: could not write catalog (${causeMessage(this.cause)})`;
  }
}

export interface DirectoryEntry {
  readonly name: string;
  readonly isFile: boolean;
}

/** File system access for the locale catalogs. Tests can provide an in-memory layer. */
export class CatalogFiles extends Context.Service<
  CatalogFiles,
  {
    readonly readDirectory: (
      directory: string,
    ) => Effect.Effect<ReadonlyArray<DirectoryEntry>, CatalogDirectoryError>;
    readonly readText: (file: string) => Effect.Effect<string, CatalogReadError>;
    readonly makeDirectory: (directory: string) => Effect.Effect<void, CatalogWriteError>;
    /** Copies a file only when the target does not exist yet. */
    readonly copyFileIfMissing: (
      source: string,
      target: string,
    ) => Effect.Effect<void, CatalogWriteError>;
  }
>()("translations/CatalogFiles") {}

export const nodeCatalogFilesLayer = Layer.succeed(CatalogFiles, {
  readDirectory: (directory) =>
    Effect.tryPromise({
      try: async () => readdir(directory, { withFileTypes: true }),
      catch: (cause) => new CatalogDirectoryError({ path: directory, cause }),
    }).pipe(
      Effect.map((entries) =>
        entries.map((entry) => ({ name: entry.name, isFile: entry.isFile() })),
      ),
    ),
  readText: (file) =>
    Effect.tryPromise({
      try: async () => readFile(file, "utf8"),
      catch: (cause) => new CatalogReadError({ path: file, cause }),
    }),
  makeDirectory: (directory) =>
    Effect.tryPromise({
      try: async () => {
        await mkdir(directory, { recursive: true });
      },
      catch: (cause) => new CatalogWriteError({ path: directory, cause }),
    }),
  copyFileIfMissing: (source, target) =>
    Effect.tryPromise({
      try: async () => {
        try {
          await copyFile(source, target, constants.COPYFILE_EXCL);
        } catch (error) {
          if (!hasErrorCode(error, "EEXIST")) throw error;
        }
      },
      catch: (cause) => new CatalogWriteError({ path: target, cause }),
    }),
});

function valueKind(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function placeholders(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...value.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1] ?? "").toSorted();
}

function compareValues(
  source: unknown,
  translated: unknown,
  location: string,
  errors: string[],
): void {
  const sourceKind = valueKind(source);
  const translatedKind = valueKind(translated);
  if (sourceKind !== translatedKind) {
    errors.push(`${location}: expected ${sourceKind}, received ${translatedKind}`);
    return;
  }

  if (typeof source === "string" && typeof translated === "string") {
    if (source.length > 0 && translated.length === 0) {
      errors.push(`${location}: translation must not be empty`);
    }
    const sourcePlaceholders = placeholders(source);
    const translatedPlaceholders = placeholders(translated);
    if (sourcePlaceholders.join("|") !== translatedPlaceholders.join("|")) {
      errors.push(
        `${location}: placeholders must remain ${JSON.stringify(sourcePlaceholders)}, received ${JSON.stringify(translatedPlaceholders)}`,
      );
    }
    return;
  }

  if (Array.isArray(source) && Array.isArray(translated)) {
    if (source.length !== translated.length) {
      errors.push(
        `${location}: expected ${source.length} array items, received ${translated.length}`,
      );
      return;
    }
    for (let index = 0; index < source.length; index += 1) {
      compareValues(source[index], translated[index], `${location}[${index}]`, errors);
    }
    return;
  }

  if (Predicate.isObject(source) && Predicate.isObject(translated)) {
    const sourceObject: Record<PropertyKey, unknown> = source;
    const translatedObject: Record<PropertyKey, unknown> = translated;
    const sourceKeys = Object.keys(sourceObject).toSorted();
    const translatedKeys = Object.keys(translatedObject).toSorted();
    for (const key of sourceKeys) {
      if (!(key in translatedObject)) errors.push(`${location}.${key}: missing key`);
    }
    for (const key of translatedKeys) {
      if (!(key in sourceObject)) {
        errors.push(`${location}.${key}: key does not exist in English`);
      }
    }
    for (const key of sourceKeys) {
      if (key in translatedObject) {
        compareValues(sourceObject[key], translatedObject[key], `${location}.${key}`, errors);
      }
    }
  }
}

/** Lists the JSON catalog files in a directory, sorted by name. */
export const jsonFiles = Effect.fn("Translations.jsonFiles")(function* (directory: string) {
  const files = yield* CatalogFiles;
  const entries = yield* files.readDirectory(directory);
  return entries
    .filter((entry) => entry.isFile && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .toSorted();
});

/** Reads and parses one catalog file. */
export const readCatalog = Effect.fn("Translations.readCatalog")(function* (file: string) {
  const files = yield* CatalogFiles;
  const text = yield* files.readText(file);
  return yield* Effect.try({
    try: (): unknown => JSON.parse(text),
    catch: (cause) => new CatalogJsonError({ path: file, cause }),
  });
});

/**
 * Compares every translated catalog with the English source.
 * Returns the list of problems. An empty list means that all catalogs are valid.
 */
export const validateTranslations = Effect.fn("Translations.validate")(function* (
  rootDirectory: string,
) {
  const root = path.resolve(rootDirectory);
  const errors: string[] = [];

  const sourceListing = yield* Effect.result(jsonFiles(path.join(root, SOURCE_LOCALE)));
  if (Result.isFailure(sourceListing)) {
    return [
      `${root}: English catalog is unavailable (${causeMessage(sourceListing.failure.cause)})`,
    ];
  }
  const sourceFiles = sourceListing.success;
  if (sourceFiles.length === 0) {
    return [`${root}: English catalog contains no JSON files`];
  }

  for (const locale of ALL_LOCALES) {
    const localeDirectory = path.join(root, locale);
    const listing = yield* Effect.result(jsonFiles(localeDirectory));
    if (Result.isFailure(listing)) {
      errors.push(
        `${localeDirectory}: locale is unavailable (${causeMessage(listing.failure.cause)})`,
      );
      continue;
    }

    const files = listing.success;
    for (const file of sourceFiles.filter((name) => !files.includes(name))) {
      errors.push(`${locale}/${file}: missing namespace`);
    }
    for (const file of files.filter((name) => !sourceFiles.includes(name))) {
      errors.push(`${locale}/${file}: namespace does not exist in English`);
    }
  }

  // A missing namespace is already reported above. Do not report it again as unreadable.
  const readOrRecord = (file: string) =>
    readCatalog(file).pipe(
      Effect.asSome,
      Effect.catch((error) =>
        Effect.sync(() => {
          if (!(error instanceof CatalogReadError && hasErrorCode(error.cause, "ENOENT"))) {
            errors.push(error.message);
          }
          return Option.none();
        }),
      ),
    );

  for (const file of sourceFiles) {
    const source = yield* readOrRecord(path.join(root, SOURCE_LOCALE, file));
    if (Option.isNone(source)) continue;

    for (const locale of TRANSLATED_LOCALES) {
      const translated = yield* readOrRecord(path.join(root, locale, file));
      if (Option.isSome(translated)) {
        compareValues(source.value, translated.value, `${locale}/${file}`, errors);
      }
    }
  }

  return errors;
});

/** Validates the catalogs, prints the result, and returns the process exit code. */
export const reportTranslationValidation = Effect.fn("Translations.reportValidation")(function* (
  rootDirectory: string,
) {
  const errors = yield* validateTranslations(rootDirectory);
  if (errors.length > 0) {
    yield* Console.error(`Translation validation failed with ${errors.length} error(s):`);
    for (const error of errors) yield* Console.error(`- ${error}`);
    return 1 as const;
  }
  yield* Console.log(`Translation catalogs are valid for ${ALL_LOCALES.join(", ")}.`);
  return 0 as const;
});

/** Copies each English catalog into every locale that does not have it yet. */
export const seedLocales = Effect.fn("Translations.seedLocales")(function* (rootDirectory: string) {
  const files = yield* CatalogFiles;
  const root = path.resolve(rootDirectory);
  const englishDirectory = path.join(root, SOURCE_LOCALE);
  const sourceFiles = yield* jsonFiles(englishDirectory);

  for (const locale of TRANSLATED_LOCALES) {
    const localeDirectory = path.join(root, locale);
    yield* files.makeDirectory(localeDirectory);
    for (const file of sourceFiles) {
      yield* files.copyFileIfMissing(
        path.join(englishDirectory, file),
        path.join(localeDirectory, file),
      );
    }
  }

  yield* Console.log(
    "Created missing German, Spanish, French, Hindi, Polish, Russian, and Turkish catalogs.",
  );
});
