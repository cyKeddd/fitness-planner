import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export type ExerciseMedia = {
  gifUrl: string | null;
  sourceName: string | null;
  source: "exercisedb" | "none";
};

type MapEntry = { gifUrl: string; sourceName: string };

// Use import.meta.url instead of __dirname — this file is compiled as an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mediaMap: Record<string, MapEntry> = JSON.parse(
  readFileSync(join(__dirname, "exerciseMediaMap.json"), "utf8"),
);

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fetchExerciseMediaByName(exerciseName: string): ExerciseMedia {
  const key = normalize(exerciseName);
  const entry = mediaMap[key];
  if (entry) {
    return { gifUrl: entry.gifUrl, sourceName: entry.sourceName, source: "exercisedb" };
  }
  return { gifUrl: null, sourceName: null, source: "none" };
}
