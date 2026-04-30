import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ComparisonPage from "../pages/ComparisonPage";
import { loadCsvRaw } from "../data/csvLoaders";

vi.mock("../data/csvLoaders", () => ({
  loadCsvRaw: vi.fn(),
}));

vi.mock("../components/charts/GroupedBarChartCard", () => ({
  default: ({ title, data = [] }) => (
    <div data-testid={`chart-${title}`}>{data.length}</div>
  ),
}));

vi.mock("recharts", () => {
  const MockContainer = ({ children }) => <div>{children}</div>;

  return {
    LineChart: MockContainer,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: MockContainer,
  };
});

const csvFixtures = {
  "B4c.csv": [
    "Category,Item_Name,Region_Name,2026_GAA_Amount,Page_No",
    "Roads,Road Project,NCR,100,1",
  ].join("\n"),
  "B8.csv": [
    "Dept_Name,2024_Actual_Personnel_Services,2024_Actual_Maintenance_and_Other_Operating_Expenses,2024_Actual_Capital_Outlays_and_Net_Lending,2024_Actual_Financial_Expenses,2024_Actual_Total,2025_Program_Personnel_Services,2025_Program_Maintenance_and_Other_Operating_Expenses,2025_Program_Capital_Outlays_and_Net_Lending,2025_Program_Financial_Expenses,2025_Program_Total,2026_GAA_Personnel_Services,2026_GAA_Maintenance_and_Other_Operating_Expenses,2026_GAA_Capital_Outlays_and_Net_Lending,2026_GAA_Financial_Expenses,2026_GAA_Total,Page_No",
    "Dept Alpha,10,20,30,0,60,15,25,35,0,75,20,30,40,0,90,1",
    "Dept Beta,8,10,12,0,30,12,18,21,0,51,16,22,28,0,66,1",
  ].join("\n"),
  "B21.csv": [
    "Department_Special_Purpose_Fund_Name,2024_Actual_CC_Expenditure_Adaptation,2024_Actual_CC_Expenditure_Mitigation,2024_Actual_CC_Expenditure_Total,2025_GAA_CC_Expenditure_Adaptation,2025_GAA_CC_Expenditure_Mitigation,2025_GAA_CC_Expenditure_Total,2026_GAA_CC_Expenditure_Adaptation,2026_GAA_CC_Expenditure_Mitigation,2026_GAA_CC_Expenditure_Total,Notes",
    "DEPARTMENTS (Total),100,60,160,110,70,180,120,80,200,",
    "Department of Agriculture,20,5,25,30,10,40,35,15,50,",
    "Department of Budget and Management,5,15,20,8,16,24,10,18,28,",
  ].join("\n"),
};

function clickItemForSide(label, sideIndex) {
  const buttons = screen.getAllByRole("button", { name: label });
  fireEvent.click(buttons[sideIndex]);
}

describe("ComparisonPage", () => {
  beforeEach(() => {
    loadCsvRaw.mockImplementation(async (filename) => csvFixtures[filename] || csvFixtures["B4c.csv"]);
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("renders a comparison summary for department comparison using the current B8 schema", async () => {
    render(<ComparisonPage selectedYears={["2025"]} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dept-dept" } });

    await screen.findAllByRole("button", { name: "Dept Alpha" });
    clickItemForSide("Dept Alpha", 0);
    clickItemForSide("Dept Beta", 1);

    await waitFor(() => {
      expect(screen.getByText("AI-Generated Comparison Summary")).toBeInTheDocument();
      expect(screen.getByText(/Dept Alpha recorded a 2025 allocation/i)).toBeInTheDocument();
    });
  });

  it("renders a comparison summary for climate comparison using the current B21 schema", async () => {
    render(<ComparisonPage selectedYears={["2026"]} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "climate" } });

    await screen.findAllByRole("button", { name: "Department of Agriculture" });
    clickItemForSide("Department of Agriculture", 0);
    clickItemForSide("Department of Budget and Management", 1);

    await waitFor(() => {
      expect(screen.getByText("AI-Generated Comparison Summary")).toBeInTheDocument();
      expect(screen.getByText(/Department of Agriculture recorded a 2026 allocation/i)).toBeInTheDocument();
    });
  });
});
