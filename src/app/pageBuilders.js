import { adaptClimateDataset } from "../data/adapters/climate";
import { adaptSingleYearRegionalDataset } from "../data/adapters/singleYearRegional";
import { adaptThreeYearBudgetDataset } from "../data/adapters/threeYearBudget";

function buildNavLabel(label, id) {
  return label.includes(id) ? label : `${label} (${id})`;
}

function createPage(config) {
  return {
    supportsYearFilter: true,
    supportsDownload: true,
    defaultYears: ["2025"],
    ...config,
    navLabel: buildNavLabel(config.label, config.id),
  };
}

export function buildSummaryPage(config) {
  return createPage({
    componentKey: "multiYearSummary",
    templateType: "multiYearSummary",
    adapter: adaptThreeYearBudgetDataset,
    ...config,
  });
}

export function buildClimatePage(config) {
  return createPage({
    componentKey: "climate",
    templateType: "climate",
    adapter: adaptClimateDataset,
    ...config,
  });
}

export function buildRegionalPage(config) {
  return createPage({
    componentKey: "singleYearRegional",
    templateType: "singleYearRegional",
    adapter: adaptSingleYearRegionalDataset,
    supportsYearFilter: false,
    defaultYears: ["2026"],
    ...config,
  });
}

export function buildPlaceholderPage(config) {
  return createPage({
    componentKey: "placeholder",
    templateType: "placeholder",
    supportsYearFilter: false,
    supportsDownload: false,
    csvFile: null,
    adapter: null,
    ...config,
  });
}

export function buildRoutePath(id) {
  return `/${id.toLowerCase().replace(/\./g, "")}`;
}
