import { createDatasetPage } from "./createDatasetPage";
import B2Template from "./templates/B2Template";
import { buildB2ViewModel } from "./viewModels/buildB2ViewModel";

export const buildViewModel = buildB2ViewModel;
export default createDatasetPage({
  template: B2Template,
  buildViewModel,
  loadingDescription: "The CSV is loading lazily for this route so the rest of the dashboard can stay lighter.",
});
