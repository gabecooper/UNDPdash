import { buildA5ViewModel } from "./viewModels/buildA5ViewModel";
import { createDatasetPage } from "./createDatasetPage";
import A5Template from "./templates/A5Template";

export const buildViewModel = buildA5ViewModel;
export default createDatasetPage({
  template: A5Template,
  buildViewModel,
  loadingDescription: "The CSV is loading lazily for this route so the rest of the dashboard can stay lighter.",
});
