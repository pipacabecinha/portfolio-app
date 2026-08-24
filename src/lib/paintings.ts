import fs from "fs";
import path from "path";
import { imageSizeFromFile } from "image-size/fromFile";
import { COLLECTIONS_ORDER, type Collection } from "@/lib/collections";

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

const CSV_PATH = path.join(process.cwd(), "data", "paintings.csv");
const IMAGES_DIR = path.join(process.cwd(), "public", "images", "paintings");

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(content: string): Record<string, string>[] {
  const withoutBom = content.replace(/^﻿/, "");
  const lines = withoutBom.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? "").trim();
    });
    return row;
  });
}

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

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCsv(csvContent);

  const seenSlugs = new Set<string>();

  const paintings = await Promise.all(
    rows.map(async (row) => {
      const filename = row.image_filename;
      const imagePath = path.join(IMAGES_DIR, filename);
      const dimensions = await imageSizeFromFile(imagePath);

      let slug = slugify(filename);
      if (seenSlugs.has(slug)) {
        let suffix = 2;
        while (seenSlugs.has(`${slug}-${suffix}`)) suffix++;
        slug = `${slug}-${suffix}`;
      }
      seenSlugs.add(slug);

      return {
        id: slug,
        collection: row.collection,
        title: row.title,
        medium: row.medium,
        dimensionsCm: row.dimensions_cm,
        year: row.year,
        imageSrc: `/images/paintings/${filename}`,
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
  const idx = COLLECTIONS_ORDER.indexOf(collection as Collection);
  return idx === -1 ? COLLECTIONS_ORDER.length : idx;
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
