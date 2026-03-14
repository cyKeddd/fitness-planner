import { trpc } from "@/lib/trpc";

const KG_TO_LBS = 2.20462;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 10) / 10;
}

/**
 * Returns user's preferred weight unit and helpers for display/input conversion.
 * Values are stored in kg in the DB; convert only for display when user prefers lbs.
 */
export function useUnit() {
  const { data: profile } = trpc.profile.get.useQuery(undefined);
  const preferredUnit = (profile?.preferredUnit as "kg" | "lbs" | undefined) ?? "kg";

  const formatWeight = (kg: number | null | undefined): string => {
    if (kg == null || isNaN(kg)) return "—";
    const num = preferredUnit === "lbs" ? kgToLbs(kg) : kg;
    const str = Math.abs(num) >= 1000 ? Math.round(num).toLocaleString() : Number(num).toLocaleString(undefined, { maximumFractionDigits: 1 });
    return preferredUnit === "lbs" ? `${str} lbs` : `${str} kg`;
  };

  /** Format weight for display without unit suffix (e.g. for charts) */
  const formatWeightValue = (kg: number | null | undefined): string => {
    if (kg == null || isNaN(kg)) return "—";
    if (preferredUnit === "lbs") {
      return String(kgToLbs(kg));
    }
    return String(kg);
  };

  /** Convert user input to kg for storage. Input is in user's preferred unit. */
  const inputToKg = (value: number): number => {
    if (preferredUnit === "lbs") return lbsToKg(value);
    return value;
  };

  /** Convert kg to display value in user's preferred unit */
  const kgToDisplay = (kg: number): number => {
    if (preferredUnit === "lbs") return kgToLbs(kg);
    return kg;
  };

  /** Placeholder/label for weight input */
  const weightUnit = preferredUnit;

  return {
    preferredUnit,
    formatWeight,
    formatWeightValue,
    inputToKg,
    kgToDisplay,
    weightUnit,
  };
}
