import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "./app/AppShell";
import { getDefaultPage, pageSections, findPageByPath } from "./app/pageRegistry";
import { pageComponents } from "./app/pageComponents";
import RenderErrorBoundary from "./components/common/RenderErrorBoundary";
import { usePathRouter } from "./app/usePathRouter";
import PageStateCard from "./components/common/PageStateCard";
import { sortYears } from "./data/yearFields";

function RouteFallback() {
  return (
    <PageStateCard
      eyebrow="Loading"
      title="Loading dashboard route"
      description="Page code is being loaded lazily for the current route."
    />
  );
}

export default function App() {
  const { pathname, navigate, replace } = usePathRouter();
  const defaultPage = getDefaultPage();
  const activePage = useMemo(() => findPageByPath(pathname) || defaultPage, [defaultPage, pathname]);
  const [selectedYears, setSelectedYears] = useState(defaultPage.defaultYears);

  useEffect(() => {
    if (!findPageByPath(pathname)) {
      replace(defaultPage.route);
    }
  }, [defaultPage.route, pathname, replace]);

  useEffect(() => {
    setSelectedYears((current) => {
      if (!current.length) return activePage.defaultYears || defaultPage.defaultYears;
      return sortYears(current);
    });
  }, [activePage, defaultPage.defaultYears]);

  const ActivePageComponent = pageComponents[activePage.componentKey];

  return (
    <AppShell
      sections={pageSections}
      activePage={activePage}
      onNavigate={navigate}
      selectedYears={selectedYears}
      onToggleYear={(year) =>
        setSelectedYears((current) => {
          if (current.includes(year)) {
            return sortYears(current.filter((item) => item !== year));
          }

          return sortYears([...current, year]);
        })
      }
    >
      <RenderErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <ActivePageComponent page={activePage} selectedYears={selectedYears} />
        </Suspense>
      </RenderErrorBoundary>
    </AppShell>
  );
}
