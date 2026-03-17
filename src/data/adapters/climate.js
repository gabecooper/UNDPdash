import { adaptThreeYearBudgetDataset } from "./threeYearBudget";

export function adaptClimateDataset(raw) {
  return adaptThreeYearBudgetDataset(raw, "climate");
}
