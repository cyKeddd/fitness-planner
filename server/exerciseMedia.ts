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
  reason?: "missing_api_key" | "not_found" | "request_failed";
};

const BASE_URLS = [
  process.env.EXERCISEDB_API_URL,
  "https://exercisedb-api.p.rapidapi.com",
  "https://exercisedb.p.rapidapi.com",
].filter(Boolean) as string[];
const API_KEY = process.env.EXERCISEDB_API_KEY ?? "";
const API_HOST = process.env.EXERCISEDB_API_HOST ?? "exercisedb.p.rapidapi.com";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const DEBUG_ENDPOINT = "http://127.0.0.1:7390/ingest/4ad115fb-1f1e-4021-b27e-810d44d0c03b";

const cache = new Map<string, { value: ExerciseMedia; expiresAt: number }>();

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeaders() {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) {
    headers["X-RapidAPI-Key"] = API_KEY;
    headers["X-RapidAPI-Host"] = API_HOST;
  }
  return headers;
}

function allResults(payload: unknown): ExternalExercise[] {
  if (Array.isArray(payload) && payload.length > 0) return payload as ExternalExercise[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data.length > 0) return obj.data as ExternalExercise[];
    if (Array.isArray(obj.results) && obj.results.length > 0) return obj.results as ExternalExercise[];
  }
  return [];
}

function toMedia(result: ExternalExercise | null): ExerciseMedia {
  if (!result) {
    return { imageUrl: null, videoUrl: null, sourceName: null, source: "none", reason: "not_found" };
  }
  return {
    imageUrl: result.imageUrl ?? result.gifUrl ?? null,
    videoUrl: result.videoUrl ?? null,
    sourceName: result.name ?? null,
    source: "exercisedb",
  };
}

function scoreResult(query: string, result: ExternalExercise): number {
  const q = normalizeName(query);
  const n = normalizeName(result.name ?? "");
  if (!n) return 0;
  if (n === q) return 100;
  if (n.includes(q)) return 80;
  if (q.includes(n)) return 70;
  const qTokens = new Set(q.split(" "));
  const nTokens = n.split(" ");
  const overlap = nTokens.filter((t) => qTokens.has(t)).length;
  return overlap * 10;
}

function nameCandidates(exerciseName: string): string[] {
  const raw = normalizeName(exerciseName);
  const stripped = raw
    .replace(/\b(barbell|dumbbell|machine|bodyweight|cable|kettlebell|lever|smith)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = [raw, stripped].filter(Boolean);
  return Array.from(new Set(base));
}

async function fetchByPath(path: string): Promise<ExternalExercise[]> {
  for (const baseUrl of BASE_URLS) {
    const response = await fetch(`${baseUrl}${path}`, { headers: buildHeaders() });
    if (!response.ok) continue;
    const payload = await response.json();
    const results = allResults(payload);
    if (results.length > 0) return results;
  }
  return [];
}

export async function fetchExerciseMediaByName(exerciseName: string): Promise<ExerciseMedia> {
  const key = normalizeName(exerciseName);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  // #region agent log
  fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H1',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:start',message:'Starting media fetch',data:{exerciseName,normalizedKey:key,hasApiKey:Boolean(API_KEY),baseUrlCount:BASE_URLS.length,cacheHit:false},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!API_KEY) {
    const missing: ExerciseMedia = {
      imageUrl: null,
      videoUrl: null,
      sourceName: null,
      source: "none",
      reason: "missing_api_key",
    };
    // #region agent log
    fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H1',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:missingKey',message:'Missing ExerciseDB API key',data:{exerciseName},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    cache.set(key, { value: missing, expiresAt: now + CACHE_TTL_MS });
    return missing;
  }

  try {
    for (const candidate of nameCandidates(exerciseName)) {
      const encoded = encodeURIComponent(candidate);
      const matches = await fetchByPath(`/exercises/name/${encoded}?limit=10`);
      // #region agent log
      fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H4',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:candidateResults',message:'Candidate lookup results',data:{exerciseName,candidate,matchesCount:matches.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (matches.length === 0) continue;
      const best = matches
        .map((m) => ({ m, score: scoreResult(exerciseName, m) }))
        .sort((a, b) => b.score - a.score)[0]?.m;
      const media = toMedia(best ?? null);
      if (media.imageUrl || media.videoUrl) {
        // #region agent log
        fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H4',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:matchSelected',message:'Selected best media match',data:{exerciseName,selectedName:media.sourceName,hasImage:Boolean(media.imageUrl),hasVideo:Boolean(media.videoUrl)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        cache.set(key, { value: media, expiresAt: now + CACHE_TTL_MS });
        return media;
      }
    }

    const none: ExerciseMedia = { imageUrl: null, videoUrl: null, sourceName: null, source: "none", reason: "not_found" };
    // #region agent log
    fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H3',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:notFound',message:'No media found after candidate matching',data:{exerciseName},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    cache.set(key, { value: none, expiresAt: now + CACHE_TTL_MS });
    return none;
  } catch (error) {
    const none: ExerciseMedia = { imageUrl: null, videoUrl: null, sourceName: null, source: "none", reason: "request_failed" };
    // #region agent log
    fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c9da6f'},body:JSON.stringify({sessionId:'c9da6f',runId:'initial',hypothesisId:'H2',location:'server/exerciseMedia.ts:fetchExerciseMediaByName:exception',message:'Media fetch threw exception',data:{exerciseName,errorMessage:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    cache.set(key, { value: none, expiresAt: now + CACHE_TTL_MS });
    return none;
  }
}
