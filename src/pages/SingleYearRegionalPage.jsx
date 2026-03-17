import SingleYearRegionalTemplate from "./templates/SingleYearRegionalTemplate";
import { createDatasetPage } from "./createDatasetPage";
import { buildSingleYearRegionalViewModel } from "./viewModels/buildSingleYearRegionalViewModel";

export const buildViewModel = buildSingleYearRegionalViewModel;
export default createDatasetPage({
  template: SingleYearRegionalTemplate,
  buildViewModel,
  includeSelectedYears: false,
});
