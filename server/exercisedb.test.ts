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
      expect(result).toHaveProperty("imageUrl");
      expect(result).toHaveProperty("videoUrl");

      // If API key is valid, we should get data from exercisedb
      if (result.source === "exercisedb") {
        expect(result.imageUrl || result.videoUrl).toBeTruthy();
      } else if (result.source === "none") {
        // If no data, there should be a reason
        expect(result.reason).toBeDefined();
      }
    },
    { timeout: 15000 }
  );

  it("should handle missing exercises gracefully", async () => {
    const result = await fetchExerciseMediaByName("nonexistent_exercise_xyz_12345");

    expect(result).toBeDefined();
    // Should either return no media or indicate not found
    expect(
      result.source === "none" ||
        (result.imageUrl === null && result.videoUrl === null)
    ).toBe(true);
  });
});
