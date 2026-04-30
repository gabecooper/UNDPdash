import { lazy } from "react";

export const pageComponents = {
  a4: lazy(() => import("../pages/A4Page")),
  a5: lazy(() => import("../pages/A5Page")),
  b1: lazy(() => import("../pages/B1Page")),
  b2: lazy(() => import("../pages/B2Page")),
  multiYearSummary: lazy(() => import("../pages/MultiYearSummaryPage")),
  climate: lazy(() => import("../pages/ClimatePage")),
  singleYearRegional: lazy(() => import("../pages/SingleYearRegionalPage")),
  comparison: lazy(() => import("../pages/ComparisonPage")),
  datasetIndex: lazy(() => import("../pages/DatasetIndexPage")),
  placeholder: lazy(() => import("../pages/PlaceholderPage")),
  home: lazy(() => import("../pages/HomePage")),
  peopleBudgetComparison: lazy(() => import("../pages/PeopleBudgetComparisonPage")),
  grantPortfolio: lazy(() => import("../pages/GrantPortfolioPage")),
};
