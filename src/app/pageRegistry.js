import { adaptA4Dataset } from "../data/adapters/a4";
import { adaptThreeYearBudgetDataset } from "../data/adapters/threeYearBudget";
import { buildClimatePage, buildRegionalPage, buildRoutePath, buildSummaryPage } from "./pageBuilders";

function buildNavLabel(label, id) {
  return label.includes(id) ? label : `${label} (${id})`;
}

function createA4Page(config) {
  return {
    supportsYearFilter: true,
    supportsDownload: true,
    defaultYears: ["2025"],
    componentKey: "a4",
    templateType: "multiYearHierarchyDetail",
    adapter: adaptA4Dataset,
    route: buildRoutePath(config.id),
    ...config,
    navLabel: buildNavLabel(config.label, config.id),
  };
}

function createA5Page(config) {
  return {
    supportsYearFilter: true,
    supportsDownload: true,
    defaultYears: ["2025"],
    componentKey: "a5",
    templateType: "multiYearHierarchyDetail",
    adapter: adaptThreeYearBudgetDataset,
    route: buildRoutePath(config.id),
    ...config,
    navLabel: buildNavLabel(config.label, config.id),
  };
}

function createB1Page(config) {
  return {
    supportsYearFilter: true,
    supportsDownload: true,
    defaultYears: ["2025"],
    componentKey: "b1",
    templateType: "multiYearHierarchyDetail",
    adapter: adaptThreeYearBudgetDataset,
    route: buildRoutePath(config.id),
    ...config,
    navLabel: buildNavLabel(config.label, config.id),
  };
}

function createB2Page(config) {
  return {
    supportsYearFilter: true,
    supportsDownload: true,
    defaultYears: ["2025"],
    componentKey: "b2",
    templateType: "multiYearHierarchyDetail",
    adapter: adaptThreeYearBudgetDataset,
    route: buildRoutePath(config.id),
    ...config,
    navLabel: buildNavLabel(config.label, config.id),
  };
}

function applyTreemapAlternation(sections) {
  let pageIndex = 0;

  return sections.map((section) => ({
    ...section,
    pages: section.pages.map((page) => {
      const nextPage = {
        ...page,
        treemapFirst: pageIndex % 2 === 1,
      };
      pageIndex += 1;
      return nextPage;
    }),
  }));
}

const basePageSections = [
  {
    key: "a-pages",
    title: "A Pages",
    pages: [
      createA4Page({
        id: "A.4",
        label: "Public Sector Infrastructure Budget",
        csvFile: "A4.csv",
        sourcePdfFiles: ["A.4.pdf"],
      }),
      createA5Page({
        id: "A.5",
        label: "Sectoral Distribution of Public Expenditures",
        csvFile: "A5.csv",
        sourcePdfFiles: ["A.5.pdf"],
        viewConfig: {
          primaryDimensionKey: "subSectorName",
          secondaryDimensionKey: "entityType",
          tableDimensionKeys: ["sectorName", "subSectorName", "entityType"],
          searchDimensionKeys: ["sectorName", "subSectorName", "entityType"],
          searchPlaceholder: "Search sector, subsector, entity type...",
        },
      }),
    ],
  },
  {
    key: "b-pages",
    title: "B Pages",
    pages: [
      createB1Page({
        id: "B.1",
        label: "Expenditure Program by Object",
        csvFile: "B1.csv",
        sourcePdfFiles: ["B.1.pdf"],
        viewConfig: {
          primaryDimensionKey: "expenseClass",
          secondaryDimensionKey: "subExpenseClass",
          tableDimensionKeys: ["expenseClass", "subExpenseClass", "itemName"],
          searchDimensionKeys: ["expenseClass", "subExpenseClass", "itemName"],
          searchPlaceholder: "Search expense class, sub class, item...",
        },
      }),
      createB2Page({
        id: "B.2",
        label: "Obligations by Object of Expenditures by Department/Special Purpose Fund",
        csvFile: "B2.csv",
        sourcePdfFiles: ["B.2.pdf"],
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "expenseClass",
          tableDimensionKeys: ["deptName", "expenseClass", "objectExpenditure", "appropType"],
          searchDimensionKeys: ["deptName", "expenseClass", "objectExpenditure", "appropType"],
          searchPlaceholder: "Search department, class, object, type...",
        },
      }),
      buildSummaryPage({
        id: "B.3",
        label: "Infrastructure Outlays",
        route: buildRoutePath("B.3"),
        csvFile: "B3.csv",
        sourcePdfFiles: ["B.3.pdf"],
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "agencyName",
          groupedChartMode: "breakdown",
          tableDimensionKeys: ["deptName", "agencyName", "fundingSource", "itemName"],
          searchDimensionKeys: ["deptName", "agencyName", "fundingSource", "itemName"],
          searchPlaceholder: "Search department, agency, funding source...",
        },
      }),
      buildRegionalPage({
        id: "B.4.c",
        label: "Infrastructure Outlays, Regional Breakdown",
        route: buildRoutePath("B.4.c"),
        csvFile: "B4c.csv",
        sourcePdfFiles: ["B.4.pdf"],
        viewConfig: {
          primaryDimensionKey: "regionName",
          secondaryDimensionKey: "category",
          groupedDimensionKey: "regionName",
          tableDimensionKeys: ["category", "itemName", "regionName"],
          searchDimensionKeys: ["category", "itemName", "regionName"],
          searchPlaceholder: "Search category, item, region...",
          rowTransform: (row) => {
            const regionName = row.dimensions?.regionName;
            const nextRegionName = regionName === "Central Office" || regionName === "NCR"
              ? "Central Offices / NCR"
              : regionName === "Nationwide"
                ? "Nation wide (unallocated to a particular region)"
                : regionName;

            return {
              ...row,
              dimensions: {
                ...row.dimensions,
                regionName: nextRegionName,
              },
            };
          },
        },
      }),
      buildSummaryPage({
        id: "B.5",
        label: "Expenditure Program by Sector / Details of Sectoral Allocation of National Government Expenditures (B.5 / B.5.a)",
        route: buildRoutePath("B.5"),
        csvFile: "B5a.csv",
        sourcePdfFiles: ["B.5.pdf", "B5a.pdf"],
        aliases: [buildRoutePath("B.5.a")],
        viewConfig: {
          primaryDimensionKey: "sectorName",
          secondaryDimensionKey: "subSectorName",
          groupedDimensionKey: "subSectorName",
          tableDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchPlaceholder: "Search sector, subsector, department, item...",
        },
      }),
      buildSummaryPage({
        id: "B.5.b",
        label: "Classification of the Functions of Government / Details of the Classification of the Functions of Government (B.5.b / B.5.c)",
        route: buildRoutePath("B.5.b"),
        csvFile: "B5c.csv",
        sourcePdfFiles: ["B5b.pdf", "B5c.pdf"],
        aliases: [buildRoutePath("B.5.c")],
        viewConfig: {
          primaryDimensionKey: "cofogCategory",
          secondaryDimensionKey: "deptName",
          treemapDimensionKey: "cofogCategory",
          groupedDimensionKey: "cofogCategory",
          primaryMovesDimensionKey: "cofogCategory",
          secondaryMovesDimensionKey: "agencyName",
          customKpiMode: "cofogHeadlineTotals",
          tableDimensionKeys: ["cofogCategory", "deptName", "agencyName", "itemName"],
          searchDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
          searchPlaceholder: "Search department, agency, COFOG category, item...",
          drilldownConfig: {
            primaryKey: "deptName",
            secondaryKey: "agencyName",
            breakdownMode: "dimension",
            breakdownDimensionKey: "cofogCategory",
            title: "Selected Department / Agency Across COFOG",
            emptyLabel: "Select a department or agency to display its COFOG allocation breakdown.",
          },
        },
      }),
      buildRegionalPage({
        id: "B.6.c",
        label: "Regional Allocation of the Expenditure Program by Department/Special Purpose Fund",
        route: buildRoutePath("B.6.c"),
        csvFile: "B6c.csv",
        sourcePdfFiles: ["B6c.pdf"],
        viewConfig: {
          primaryDimensionKey: "regionName",
          secondaryDimensionKey: "deptName",
          groupedDimensionKey: "regionName",
          tableDimensionKeys: ["deptName", "agencyName", "regionName", "allocationType"],
          searchDimensionKeys: ["deptName", "agencyName", "regionName", "allocationType"],
          searchPlaceholder: "Search department, agency, region, type...",
          drilldownConfig: {
            primaryKey: "deptName",
            secondaryKey: "agencyName",
            breakdownDimensionKey: "regionName",
            title: "Selected Department Regional Breakdown",
            emptyLabel: "Select a department to display its regional allocation breakdown.",
          },
          rowTransform: (row) => {
            const regionName = row.dimensions?.regionName;
            const nextRegionName = regionName === "Central Office" || regionName === "NCR"
              ? "Central Offices / NCR"
              : regionName === "Nationwide"
                ? "Nation wide (unallocated to a particular region)"
                : regionName;

            return {
              ...row,
              dimensions: {
                ...row.dimensions,
                regionName: nextRegionName,
              },
            };
          },
        },
      }),
      buildSummaryPage({
        id: "B.7",
        label: "National Government Expenditures by Recipient Unit",
        route: buildRoutePath("B.7"),
        csvFile: "B7.csv",
        sourcePdfFiles: ["B7.pdf"],
        viewConfig: {
          primaryDimensionKey: "expenseType",
          secondaryDimensionKey: "recipientUnit",
          tableDimensionKeys: ["expenseType", "recipientUnit"],
          searchDimensionKeys: ["expenseType", "recipientUnit"],
          searchPlaceholder: "Search expense type or recipient unit...",
        },
      }),
      buildSummaryPage({
        id: "B.8",
        label: "Expenditure Program by Department/Special Purpose Fund, by General Expense Class / Expenditure Program by Agency, General Expense Class (B.8 / B.9)",
        route: buildRoutePath("B.8"),
        csvFile: "B9.csv",
        sourcePdfFiles: ["B8.pdf", "B9.pdf"],
        aliases: [buildRoutePath("B.9")],
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "agencyName",
          groupedChartMode: "breakdown",
          tableDimensionKeys: ["deptName", "agencyName"],
          searchDimensionKeys: ["deptName", "agencyName"],
          searchPlaceholder: "Search department or agency...",
          drilldownConfig: {
            primaryKey: "deptName",
            secondaryKey: "agencyName",
            breakdownMode: "yearBreakdown",
            title: "Selected Department / Agency Expense Class Breakdown",
            emptyLabel: "Select a department or agency to display its expense class breakdown.",
          },
        },
      }),
      buildSummaryPage({
        id: "B.11",
        label: "Expenditure Program (Net of Debt Burden) by Department/Special Purpose Fund, by Program Category",
        route: buildRoutePath("B.11"),
        csvFile: "B11.csv",
        sourcePdfFiles: ["B11.pdf"],
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "agencyName",
          groupedChartMode: "breakdown",
          tableDimensionKeys: ["deptName", "agencyName"],
          searchDimensionKeys: ["deptName", "agencyName"],
          searchPlaceholder: "Search department or agency...",
          drilldownConfig: {
            primaryKey: "deptName",
            secondaryKey: "agencyName",
            breakdownMode: "yearBreakdown",
            title: "Selected Department / Agency Program Breakdown",
            emptyLabel: "Select a department or agency to display its program-category breakdown.",
          },
        },
      }),
      buildSummaryPage({
        id: "B.21",
        label: "Climate Change Expenditures by Department and Special Purpose Fund",
        route: buildRoutePath("B.21"),
        csvFile: "B21.csv",
        sourcePdfFiles: ["B21.pdf"],
        viewConfig: {
          primaryDimensionKey: "departmentSpecialPurposeFundName",
          secondaryDimensionKey: "departmentSpecialPurposeFundName",
          groupedChartMode: "breakdown",
          tableDimensionKeys: ["departmentSpecialPurposeFundName"],
          searchDimensionKeys: ["departmentSpecialPurposeFundName"],
          searchPlaceholder: "Search department or special purpose fund...",
        },
      }),
      buildSummaryPage({
        id: "B.22",
        label: "Climate Change Expenditures by NCCAP Strategic Priorities",
        route: buildRoutePath("B.22"),
        csvFile: "B22.csv",
        sourcePdfFiles: ["B22.pdf"],
        viewConfig: {
          primaryDimensionKey: "nccapPriority",
          secondaryDimensionKey: "nccapPriority",
          groupedChartMode: "breakdown",
          tableDimensionKeys: ["nccapPriority"],
          searchDimensionKeys: ["nccapPriority"],
          searchPlaceholder: "Search NCCAP priority...",
        },
      }),
    ],
  },
];

export const pageSections = applyTreemapAlternation(basePageSections);

export const datasetIndexPage = {
  id: "datasets",
  label: "View Dataset",
  route: "/datasets",
  csvFile: null,
  componentKey: "datasetIndex",
  templateType: "datasetIndex",
  supportsYearFilter: false,
  supportsDownload: false,
  defaultYears: ["2025"],
  adapter: null,
  navLabel: "View Dataset",
};

export const comparisonPage = {
  id: "comparison",
  label: "Compare",
  route: "/comparison",
  csvFile: null,
  componentKey: "comparison",
  templateType: "comparison",
  supportsYearFilter: true,
  supportsDownload: false,
  defaultYears: ["2025"],
  adapter: null,
  navLabel: "Compare",
};

export const homePage = {
  id: "home",
  label: "Home",
  route: "/home",
  csvFile: null,
  componentKey: "home",
  templateType: "home",
  supportsYearFilter: false,
  supportsDownload: false,
  defaultYears: ["2025"],
  adapter: null,
  navLabel: "Home",
};

export const peopleBudgetComparisonPage = {
  id: "peopleBudgetComparison",
  label: "People's Budget Comparison",
  route: "/peoples-budget-comparison",
  csvFile: null,
  componentKey: "peopleBudgetComparison",
  templateType: "peopleBudgetComparison",
  supportsYearFilter: true,
  supportsDownload: false,
  defaultYears: ["2025"],
  adapter: null,
  navLabel: "People's Budget Comparison",
};

export const grantPortfolioPage = {
  id: "grantPortfolio",
  label: "Grants Portfolio",
  route: "/grants-portfolio",
  csvFile: null,
  componentKey: "grantPortfolio",
  templateType: "grantPortfolio",
  supportsYearFilter: false,
  supportsDownload: false,
  defaultYears: ["2025"],
  adapter: null,
  navLabel: "Grants Portfolio",
};

export const flatPageRegistry = pageSections.flatMap((section) => section.pages);
export const allPages = [...flatPageRegistry, datasetIndexPage, comparisonPage, homePage, peopleBudgetComparisonPage, grantPortfolioPage];
export const DEFAULT_ROUTE = "/a4";

export function findPageByPath(pathname) {
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return allPages.find((page) => page.route === normalizedPath || page.aliases?.includes(normalizedPath)) || null;
}

export function getDefaultPage() {
  return flatPageRegistry.find((page) => page.route === DEFAULT_ROUTE) || flatPageRegistry[0];
}
