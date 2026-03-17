import { buildA4ViewModel } from "./viewModels/buildA4ViewModel";
import { createDatasetPage } from "./createDatasetPage";
import A4Template from "./templates/A4Template";

export const buildViewModel = buildA4ViewModel;
export default createDatasetPage({
  template: A4Template,
  buildViewModel,
  loadingDescription: "The CSV is loading lazily for this route so the rest of the dashboard can stay lighter.",
});
