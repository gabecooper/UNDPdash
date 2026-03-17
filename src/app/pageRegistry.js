import { adaptA4Dataset } from "../data/adapters/a4";
import { adaptThreeYearBudgetDataset } from "../data/adapters/threeYearBudget";
import { buildClimatePage, buildRegionalPage, buildRoutePath, buildSummaryPage } from "./pageBuilders";

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
    navLabel: `${config.label} (${config.id})`,
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
    navLabel: `${config.label} (${config.id})`,
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
    navLabel: `${config.label} (${config.id})`,
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
    navLabel: `${config.label} (${config.id})`,
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
      }),
      createA5Page({
        id: "A.5",
        label: "Sectoral Distribution of Public Expenditures",
        csvFile: "A5.csv",
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
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "agencyName",
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
        viewConfig: {
          primaryDimensionKey: "regionName",
          secondaryDimensionKey: "category",
          groupedDimensionKey: "regionName",
          tableDimensionKeys: ["category", "itemName", "regionName"],
          searchDimensionKeys: ["category", "itemName", "regionName"],
          searchPlaceholder: "Search category, item, region...",
        },
      }),
      buildSummaryPage({
        id: "B.5",
        label: "Expenditure Program by Sector",
        route: buildRoutePath("B.5"),
        csvFile: "B5a.csv",
        viewConfig: {
          primaryDimensionKey: "sectorName",
          secondaryDimensionKey: "deptAgency",
          groupedDimensionKey: "deptAgency",
          tableDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchPlaceholder: "Search sector, subsector, department, item...",
        },
      }),
      buildSummaryPage({
        id: "B.5.a",
        label: "Details of Sectoral Allocation of National Government Expenditures",
        route: buildRoutePath("B.5.a"),
        csvFile: "B5a.csv",
        viewConfig: {
          primaryDimensionKey: "subSectorName",
          secondaryDimensionKey: "deptAgency",
          tableDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchDimensionKeys: ["sectorName", "subSectorName", "deptAgency", "itemName"],
          searchPlaceholder: "Search sector, subsector, department, item...",
        },
      }),
      buildSummaryPage({
        id: "B.5.b",
        label: "Classification of the Functions of Government",
        route: buildRoutePath("B.5.b"),
        csvFile: "B5b.csv",
        viewConfig: {
          primaryDimensionKey: "cofogCategory",
          secondaryDimensionKey: "cofogSubCategory",
          treemapDimensionKey: "cofogSubCategory",
          groupedDimensionKey: "cofogSubCategory",
          primaryMovesDimensionKey: "cofogSubCategory",
          secondaryMovesDimensionKey: "cofogCategory",
          customKpiMode: "cofogHeadlineTotals",
          tableDimensionKeys: ["cofogSubCategory", "cofogCategory", "itemName"],
          searchDimensionKeys: ["cofogSubCategory", "cofogCategory", "itemName"],
          searchPlaceholder: "Search COFOG category, subcategory, item...",
        },
      }),
      buildSummaryPage({
        id: "B.5.c",
        label: "Details of the Classification of the Functions of Government",
        route: buildRoutePath("B.5.c"),
        csvFile: "B5c.csv",
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "agencyName",
          groupedDimensionKey: "deptName",
          secondaryMovesDimensionKey: "agencyName",
          customKpiMode: "largestTwoItems",
          tableDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
          searchDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
          searchPlaceholder: "Search department, agency, COFOG category, item...",
        },
      }),
      buildRegionalPage({
        id: "B.6.c",
        label: "Regional Allocation of the Expenditure Program by Department/Special Purpose Fund",
        route: buildRoutePath("B.6.c"),
        csvFile: "B6c.csv",
        viewConfig: {
          primaryDimensionKey: "regionName",
          secondaryDimensionKey: "deptName",
          tableDimensionKeys: ["deptName", "agencyName", "regionName", "allocationType"],
          searchDimensionKeys: ["deptName", "agencyName", "regionName", "allocationType"],
          searchPlaceholder: "Search department, agency, region, type...",
        },
      }),
      buildSummaryPage({
        id: "B.7",
        label: "National Government Expenditures by Recipient Unit",
        route: buildRoutePath("B.7"),
        csvFile: "B7.csv",
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
        label: "Expenditure Program by Department/Special Purpose Fund, by General Expense Class",
        route: buildRoutePath("B.8"),
        csvFile: "B8.csv",
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "expenseClass",
          tableDimensionKeys: ["deptName", "agencyName", "expenseClass"],
          searchDimensionKeys: ["deptName", "agencyName", "expenseClass"],
          searchPlaceholder: "Search department, agency, expense class...",
        },
      }),
      buildSummaryPage({
        id: "B.9",
        label: "Expenditure Program by Agency, General Expense Class",
        route: buildRoutePath("B.9"),
        csvFile: "B9.csv",
        viewConfig: {
          primaryDimensionKey: "agencyName",
          secondaryDimensionKey: "expenseClass",
          tableDimensionKeys: ["deptName", "agencyName", "expenseClass"],
          searchDimensionKeys: ["deptName", "agencyName", "expenseClass"],
          searchPlaceholder: "Search department, agency, expense class...",
        },
      }),
      buildSummaryPage({
        id: "B.11",
        label: "Expenditure Program (Net of Debt Burden) by Department/Special Purpose Fund, by Program Category",
        route: buildRoutePath("B.11"),
        csvFile: "B11.csv",
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "programCategory",
          tableDimensionKeys: ["deptName", "agencyName", "programCategory"],
          searchDimensionKeys: ["deptName", "agencyName", "programCategory"],
          searchPlaceholder: "Search department, agency, program category...",
        },
      }),
      buildClimatePage({
        id: "B.21",
        label: "Climate Change Expenditures by Department and Special Purpose Fund",
        route: buildRoutePath("B.21"),
        csvFile: "B21.csv",
        viewConfig: {
          primaryDimensionKey: "deptName",
          secondaryDimensionKey: "climateTypology",
          tableDimensionKeys: ["deptName", "climateTypology"],
          searchDimensionKeys: ["deptName", "climateTypology"],
          searchPlaceholder: "Search department or climate typology...",
        },
      }),
      buildClimatePage({
        id: "B.22",
        label: "Climate Change Expenditures by NCCAP Strategic Priorities",
        route: buildRoutePath("B.22"),
        csvFile: "B22.csv",
        viewConfig: {
          primaryDimensionKey: "agencyName",
          secondaryDimensionKey: "climateTypology",
          tableDimensionKeys: ["deptName", "agencyName", "climateTypology"],
          searchDimensionKeys: ["deptName", "agencyName", "climateTypology"],
          searchPlaceholder: "Search department, agency, climate typology...",
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

export const flatPageRegistry = pageSections.flatMap((section) => section.pages);
export const allPages = [...flatPageRegistry, datasetIndexPage];
export const DEFAULT_ROUTE = "/a4";

export function findPageByPath(pathname) {
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return allPages.find((page) => page.route === normalizedPath) || null;
}

export function getDefaultPage() {
  return flatPageRegistry.find((page) => page.route === DEFAULT_ROUTE) || flatPageRegistry[0];
}
