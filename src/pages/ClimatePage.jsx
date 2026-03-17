import ClimateTemplate from "./templates/ClimateTemplate";
import { createDatasetPage } from "./createDatasetPage";
import { buildClimateViewModel } from "./viewModels/buildClimateViewModel";

export const buildViewModel = buildClimateViewModel;
export default createDatasetPage({
  template: ClimateTemplate,
  buildViewModel,
});
