import fs from "fs";
import path from "path";
import { imageSizeFromFile } from "image-size/fromFile";
import { getCollectionsOrder } from "@/lib/collections";

export interface Painting {
  id: string;
  collection: string;
  title: string;
  medium: string;
  dimensionsCm: string;
  year: string;
  imageSrc: string;
  width: number;
  height: number;
}

interface PaintingEntry {
  collection: string;
  title?: string;
  medium?: string;
  dimensions_cm?: string;
  year?: string;
  image: string;
}

const PAINTINGS_DIR = path.join(process.cwd(), "data", "paintings");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let cache: Painting[] | null = null;

export async function getPaintings(): Promise<Painting[]> {
  if (cache) return cache;

  const files = fs.readdirSync(PAINTINGS_DIR).filter((f) => f.endsWith(".json"));
  const seenSlugs = new Set<string>();

  const paintings = await Promise.all(
    files.map(async (file) => {
      const entry = JSON.parse(
        fs.readFileSync(path.join(PAINTINGS_DIR, file), "utf-8")
      ) as PaintingEntry;

      const filename = path.basename(entry.image);
      const dimensions = await imageSizeFromFile(path.join(PUBLIC_DIR, entry.image));

      let slug = slugify(filename);
      if (seenSlugs.has(slug)) {
        let suffix = 2;
        while (seenSlugs.has(`${slug}-${suffix}`)) suffix++;
        slug = `${slug}-${suffix}`;
      }
      seenSlugs.add(slug);

      return {
        id: slug,
        collection: entry.collection,
        title: entry.title ?? "",
        medium: entry.medium ?? "",
        dimensionsCm: entry.dimensions_cm ?? "",
        year: entry.year ?? "",
        imageSrc: entry.image,
        width: dimensions.width ?? 1,
        height: dimensions.height ?? 1,
      };
    })
  );

  cache = paintings;
  return paintings;
}

export async function getPaintingById(id: string): Promise<Painting | undefined> {
  const paintings = await getPaintings();
  return paintings.find((p) => p.id === id);
}

export function collectionSortIndex(collection: string): number {
  const order = getCollectionsOrder();
  const idx = order.indexOf(collection);
  return idx === -1 ? order.length : idx;
}

export async function getSortedPaintings(): Promise<Painting[]> {
  const paintings = await getPaintings();
  return [...paintings].sort(
    (a, b) => collectionSortIndex(a.collection) - collectionSortIndex(b.collection)
  );
}

export async function getPaintingNavigation(
  id: string
): Promise<{ prev: Painting; next: Painting } | undefined> {
  const sorted = await getSortedPaintings();
  const index = sorted.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const prev = sorted[(index - 1 + sorted.length) % sorted.length];
  const next = sorted[(index + 1) % sorted.length];
  return { prev, next };
}

export function factsLine(painting: Painting): string {
  return [painting.medium, formatDimensions(painting.dimensionsCm), painting.year]
    .filter((part) => part && part.length > 0)
    .join(" · ");
}

function formatDimensions(dimensionsCm: string): string {
  if (!dimensionsCm) return "";
  const match = dimensionsCm.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*cm$/i);
  if (!match) return dimensionsCm;
  return `${match[1]} × ${match[2]} cm`;
}
