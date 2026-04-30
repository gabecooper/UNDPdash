import { createDatasetPage } from "./createDatasetPage";
import B1Template from "./templates/B1Template";
import { buildB1ViewModel } from "./viewModels/buildB1ViewModel";

export const buildViewModel = buildB1ViewModel;
export default createDatasetPage({
  template: B1Template,
  buildViewModel,
  loadingDescription: "The CSV is loading lazily for this route so the rest of the dashboard can stay lighter.",
});
