import fs from "fs";
import path from "path";

const COLLECTIONS_DIR = path.join(process.cwd(), "data", "collections");

interface CollectionEntry {
  name: string;
  order?: number;
}

let cache: string[] | null = null;

export function getCollectionsOrder(): string[] {
  if (cache) return cache;

  const files = fs.readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"));
  const entries = files.map(
    (file) =>
      JSON.parse(
        fs.readFileSync(path.join(COLLECTIONS_DIR, file), "utf-8")
      ) as CollectionEntry
  );

  entries.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

  cache = entries.map((e) => e.name);
  return cache;
}
