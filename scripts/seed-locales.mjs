import { constants } from "node:fs";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const TARGET_LOCALES = ["de", "es", "hi", "pl", "ru", "tr"];
const root = path.resolve("locales");
const englishDirectory = path.join(root, "en");
const files = (await readdir(englishDirectory)).filter((file) =>
  file.endsWith(".json"),
);

for (const locale of TARGET_LOCALES) {
  const localeDirectory = path.join(root, locale);
  await mkdir(localeDirectory, { recursive: true });
  for (const file of files) {
    try {
      await copyFile(
        path.join(englishDirectory, file),
        path.join(localeDirectory, file),
        constants.COPYFILE_EXCL,
      );
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
}

console.log(
  "Created missing German, Spanish, Hindi, Polish, Russian, and Turkish catalogs.",
);
