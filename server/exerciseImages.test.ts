import { describe, expect, it } from "vitest";
import {
  getCuratedExerciseImages,
  validateExerciseImageCoverage,
  withExerciseImages,
} from "../shared/exerciseImages";

describe("exercise image catalog", () => {
  it("returns curated images for known workout types", () => {
    const images = getCuratedExerciseImages("weights");
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toContain("/exercise-images/");
  });

  it("attaches imageUrls and primary imageUrl consistently", () => {
    const exercise = withExerciseImages({
      id: 1,
      name: "Barbell Bench Press",
      workoutType: "weights",
      imageUrl: null,
    });

    expect(Array.isArray(exercise.imageUrls)).toBe(true);
    expect(exercise.imageUrls.length).toBeGreaterThan(0);
    expect(exercise.imageUrl).toBe(exercise.imageUrls[0]);
  });

  it("fails coverage validation for unknown workout types", () => {
    const coverage = validateExerciseImageCoverage([
      { name: "Known", workoutType: "weights", imageUrl: null },
      { name: "Unknown", workoutType: "unknown_type", imageUrl: null },
    ]);

    expect(coverage.ok).toBe(false);
    expect(coverage.missing).toEqual(["Unknown (unknown_type)"]);
  });
});
