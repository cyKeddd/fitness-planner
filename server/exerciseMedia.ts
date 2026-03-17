type ExternalExercise = {
  name?: string;
  gifUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  target?: string;
  bodyPart?: string;
  equipment?: string;
  instructions?: string[] | string;
};

export type ExerciseMedia = {
  imageUrl: string | null;
  videoUrl: string | null;
  sourceName: string | null;
  source: "exercisedb" | "none";
};

const BASE_URL = process.env.EXERCISEDB_API_URL ?? "https://exercisedb.p.rapidapi.com";
const API_KEY = process.env.EXERCISEDB_API_KEY ?? "";
const API_HOST = process.env.EXERCISEDB_API_HOST ?? "exercisedb.p.rapidapi.com";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const cache = new Map<string, { value: ExerciseMedia; expiresAt: number }>();

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaders() {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) {
    headers["X-RapidAPI-Key"] = API_KEY;
    headers["X-RapidAPI-Host"] = API_HOST;
  }
  return headers;
}

function firstResult(payload: unknown): ExternalExercise | null {
  if (Array.isArray(payload) && payload.length > 0) return payload[0] as ExternalExercise;
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data.length > 0) return obj.data[0] as ExternalExercise;
    if (Array.isArray(obj.results) && obj.results.length > 0) return obj.results[0] as ExternalExercise;
  }
  return null;
}

function toMedia(result: ExternalExercise | null): ExerciseMedia {
  if (!result) {
    return { imageUrl: null, videoUrl: null, sourceName: null, source: "none" };
  }
  return {
    imageUrl: result.imageUrl ?? result.gifUrl ?? null,
    videoUrl: result.videoUrl ?? null,
    sourceName: result.name ?? null,
    source: "exercisedb",
  };
}

async function fetchByPath(path: string): Promise<ExternalExercise | null> {
  const response = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders() });
  if (!response.ok) return null;
  const payload = await response.json();
  return firstResult(payload);
}

export async function fetchExerciseMediaByName(exerciseName: string): Promise<ExerciseMedia> {
  const key = normalizeName(exerciseName);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  try {
    const encoded = encodeURIComponent(exerciseName.trim());
    const direct = await fetchByPath(`/exercises/name/${encoded}?limit=1`);
    const media = toMedia(direct);
    if (media.imageUrl || media.videoUrl) {
      cache.set(key, { value: media, expiresAt: now + CACHE_TTL_MS });
      return media;
    }

    const none: ExerciseMedia = { imageUrl: null, videoUrl: null, sourceName: null, source: "none" };
    cache.set(key, { value: none, expiresAt: now + CACHE_TTL_MS });
    return none;
  } catch {
    const none: ExerciseMedia = { imageUrl: null, videoUrl: null, sourceName: null, source: "none" };
    cache.set(key, { value: none, expiresAt: now + CACHE_TTL_MS });
    return none;
  }
}
