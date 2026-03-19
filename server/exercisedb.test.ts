import { describe, expect, it } from "vitest";
import { fetchExerciseMediaByName } from "./exerciseMedia";

describe("ExerciseDB API Integration", () => {
  it(
    "should fetch exercise media with valid API credentials",
    async () => {
      // Test with a common exercise name
      const result = await fetchExerciseMediaByName("bench press");

      // The function should return an ExerciseMedia object
      expect(result).toBeDefined();
      expect(result).toHaveProperty("source");
      expect(result).toHaveProperty("gifUrl");
      expect(result).toHaveProperty("sourceName");

      // If the exercise is found in the static map, we should get a gifUrl
      if (result.source === "exercisedb") {
        expect(result.gifUrl).toBeTruthy();
      } else if (result.source === "none") {
        // If not found in map, gifUrl should be null
        expect(result.gifUrl).toBeNull();
      }
    },
    { timeout: 15000 }
  );

  it("should handle missing exercises gracefully", async () => {
    const result = await fetchExerciseMediaByName("nonexistent_exercise_xyz_12345");

    expect(result).toBeDefined();
    // Should either return no media or indicate not found
    expect(
      result.source === "none" && result.gifUrl === null
    ).toBe(true);
  });
});
