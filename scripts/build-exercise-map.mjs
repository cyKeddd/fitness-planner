// One-time script: fetch all ExerciseDB v1 exercises and build a static
// mapping for the 90 seeded exercises. Output: server/exerciseMediaMap.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const API_BASE = "https://www.exercisedb.dev/api/v1/exercises";
const PAGE_SIZE = 100;
const DELAY_MS = 1500;

function normalize(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function score(ourName, dbName) {
  const a = normalize(ourName);
  const b = normalize(dbName);
  if (!b) return 0;
  if (a === b) return 100;
  if (b === a) return 100;

  const aTokens = a.split(" ");
  const bTokens = b.split(" ");

  if (b.includes(a)) return 85;
  if (a.includes(b)) return 75;

  const aSet = new Set(aTokens);
  const overlap = bTokens.filter((t) => aSet.has(t)).length;
  const maxLen = Math.max(aTokens.length, bTokens.length);
  return Math.round((overlap / maxLen) * 60);
}

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`;
    console.log(`Fetching offset=${offset}...`);
    const r = await fetch(url);
    if (!r.ok) {
      console.log(`  Status ${r.status} — retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
      const r2 = await fetch(url);
      if (!r2.ok) {
        console.log(`  Retry failed (${r2.status}), stopping at ${all.length} exercises.`);
        break;
      }
      const body2 = await r2.json();
      const data2 = body2?.data || [];
      all.push(...data2);
      if (data2.length < PAGE_SIZE) break;
    } else {
      const body = await r.json();
      const data = body?.data || [];
      all.push(...data);
      if (data.length < PAGE_SIZE) break;
    }
    offset += PAGE_SIZE;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return all;
}

function extractOurExerciseNames() {
  const seedPath = path.join(ROOT, "seed-exercises.mjs");
  const src = fs.readFileSync(seedPath, "utf8");
  return [...src.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
}

function buildMapping(ourNames, dbExercises) {
  const mapping = {};
  for (const name of ourNames) {
    let bestScore = 0;
    let bestMatch = null;
    for (const ex of dbExercises) {
      const s = score(name, ex.name || "");
      if (s > bestScore) {
        bestScore = s;
        bestMatch = ex;
      }
    }
    const key = normalize(name);
    if (bestScore >= 30 && bestMatch?.gifUrl) {
      mapping[key] = {
        gifUrl: bestMatch.gifUrl,
        sourceName: bestMatch.name,
        exerciseId: bestMatch.exerciseId,
        score: bestScore,
      };
      console.log(`  [${bestScore}] ${name} -> ${bestMatch.name}`);
    } else {
      console.log(`  [${bestScore}] ${name} -> NO MATCH`);
    }
  }
  return mapping;
}

async function main() {
  console.log("=== Fetching ExerciseDB v1 dataset ===");
  const dbExercises = await fetchAllExercises();
  console.log(`Fetched ${dbExercises.length} exercises total.\n`);

  console.log("=== Extracting our exercise names ===");
  const ourNames = extractOurExerciseNames();
  console.log(`Found ${ourNames.length} seeded exercises.\n`);

  console.log("=== Building mapping ===");
  const mapping = buildMapping(ourNames, dbExercises);

  const matched = Object.keys(mapping).length;
  console.log(`\nMatched: ${matched} / ${ourNames.length}`);

  const outPath = path.join(ROOT, "server", "exerciseMediaMap.json");
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
