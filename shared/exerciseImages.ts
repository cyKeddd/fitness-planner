type ExerciseImageInput = {
  id?: number;
  name: string;
  workoutType: string;
  imageUrl?: string | null;
};

const WORKOUT_TYPE_IMAGE_LIBRARY: Record<string, readonly string[]> = {
  weights: ["/exercise-images/weights.svg"],
  plyometrics: ["/exercise-images/plyometrics.svg"],
  cardio: ["/exercise-images/cardio.svg"],
  hiit: ["/exercise-images/hiit.svg"],
  yoga: ["/exercise-images/yoga.svg"],
  stretching: ["/exercise-images/stretching.svg"],
  calisthenics: ["/exercise-images/calisthenics.svg"],
  bodyweight: ["/exercise-images/bodyweight.svg"],
  crossfit: ["/exercise-images/crossfit.svg"],
  sport_specific: ["/exercise-images/sport_specific.svg"],
};

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

export function getCuratedExerciseImages(workoutType: string): string[] {
  return [...(WORKOUT_TYPE_IMAGE_LIBRARY[workoutType] ?? [])];
}

export function withExerciseImages<T extends ExerciseImageInput>(exercise: T) {
  const imageUrls = getCuratedExerciseImages(exercise.workoutType);
  const imageUrl = exercise.imageUrl ?? imageUrls[0] ?? null;
  return {
    ...exercise,
    imageUrl,
    imageUrls,
  };
}

export function validateExerciseImageCoverage(exerciseRows: ExerciseImageInput[]) {
  const missing = exerciseRows
    .filter((exercise) => getCuratedExerciseImages(exercise.workoutType).length === 0)
    .map((exercise) => `${exercise.name} (${exercise.workoutType})`);

  return {
    ok: missing.length === 0,
    missing,
  };
}

export function buildExerciseImageNameMap(
  exercises: Array<{ name: string; imageUrl?: string | null; imageUrls?: string[] }>
) {
  const byName: Record<string, { imageUrl: string | null; imageUrls: string[] }> = {};
  for (const exercise of exercises) {
    byName[normalizeExerciseName(exercise.name)] = {
      imageUrl: exercise.imageUrl ?? null,
      imageUrls: exercise.imageUrls ?? [],
    };
  }
  return byName;
}
