import MultiYearSummaryTemplate from "./templates/MultiYearSummaryTemplate";
import { createDatasetPage } from "./createDatasetPage";
import { buildMultiYearSummaryViewModel } from "./viewModels/buildMultiYearSummaryViewModel";

export const buildViewModel = buildMultiYearSummaryViewModel;
export default createDatasetPage({
  template: MultiYearSummaryTemplate,
  buildViewModel,
});
