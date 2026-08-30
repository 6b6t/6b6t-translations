import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_LOCALE = "en";
const TRANSLATED_LOCALES = ["de", "es", "hi", "pl", "ru", "tr"];
const ALL_LOCALES = [SOURCE_LOCALE, ...TRANSLATED_LOCALES];
const PLACEHOLDER_PATTERN = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

function valueKind(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(PLACEHOLDER_PATTERN)]
    .map((match) => match[1])
    .sort();
}

function compareValues(source, translated, location, errors) {
  const sourceKind = valueKind(source);
  const translatedKind = valueKind(translated);
  if (sourceKind !== translatedKind) {
    errors.push(
      `${location}: expected ${sourceKind}, received ${translatedKind}`,
    );
    return;
  }

  if (sourceKind === "string") {
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

  if (sourceKind === "array") {
    if (source.length !== translated.length) {
      errors.push(
        `${location}: expected ${source.length} array items, received ${translated.length}`,
      );
      return;
    }
    for (let index = 0; index < source.length; index += 1) {
      compareValues(
        source[index],
        translated[index],
        `${location}[${index}]`,
        errors,
      );
    }
    return;
  }

  if (sourceKind === "object") {
    const sourceKeys = Object.keys(source).sort();
    const translatedKeys = Object.keys(translated).sort();
    for (const key of sourceKeys) {
      if (!(key in translated)) errors.push(`${location}.${key}: missing key`);
    }
    for (const key of translatedKeys) {
      if (!(key in source)) {
        errors.push(`${location}.${key}: key does not exist in English`);
      }
    }
    for (const key of sourceKeys) {
      if (key in translated) {
        compareValues(
          source[key],
          translated[key],
          `${location}.${key}`,
          errors,
        );
      }
    }
  }
}

async function jsonFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

async function readJson(file, errors) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${file}: invalid JSON (${message})`);
    return null;
  }
}

export async function validateTranslations(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const errors = [];
  let sourceFiles;

  try {
    sourceFiles = await jsonFiles(path.join(root, SOURCE_LOCALE));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [`${root}: English catalog is unavailable (${message})`];
  }

  if (sourceFiles.length === 0) {
    return [`${root}: English catalog contains no JSON files`];
  }

  for (const locale of ALL_LOCALES) {
    const localeDirectory = path.join(root, locale);
    let files;
    try {
      files = await jsonFiles(localeDirectory);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${localeDirectory}: locale is unavailable (${message})`);
      continue;
    }

    const missingFiles = sourceFiles.filter((file) => !files.includes(file));
    const extraFiles = files.filter((file) => !sourceFiles.includes(file));
    for (const file of missingFiles) {
      errors.push(`${locale}/${file}: missing namespace`);
    }
    for (const file of extraFiles) {
      errors.push(`${locale}/${file}: namespace does not exist in English`);
    }
  }

  for (const file of sourceFiles) {
    const sourcePath = path.join(root, SOURCE_LOCALE, file);
    const source = await readJson(sourcePath, errors);
    if (source === null) continue;

    for (const locale of TRANSLATED_LOCALES) {
      const translatedPath = path.join(root, locale, file);
      const translated = await readJson(translatedPath, errors);
      if (translated !== null) {
        compareValues(source, translated, `${locale}/${file}`, errors);
      }
    }
  }

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootDirectory = process.argv[2] ?? "locales";
  const errors = await validateTranslations(rootDirectory);
  if (errors.length > 0) {
    console.error(`Translation validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Translation catalogs are valid for ${ALL_LOCALES.join(", ")}.`,
    );
  }
}
