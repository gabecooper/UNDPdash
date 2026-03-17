import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { TopBarOutletContext } from "../components/layout/TopBarOutletContext";
import { BlurFade } from "../components/ui/blur-fade";
import { C, F } from "../theme/tokens";

const SIDEBAR_WIDTH_STORAGE_KEY = "undp-dashboard-sidebar-width";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSidebarBounds(viewportWidth) {
  const safeViewportWidth = Math.max(viewportWidth || 0, 640);
  const minWidth = safeViewportWidth < 760 ? 190 : 212;
  const maxWidth = Math.min(420, Math.max(minWidth + 36, Math.floor(safeViewportWidth * 0.34)));
  const preferredWidth = (safeViewportWidth < 900
    ? Math.round(safeViewportWidth * 0.3)
    : Math.round(safeViewportWidth * 0.22)) * 0.9375;

  return {
    minWidth,
    maxWidth,
    defaultWidth: clamp(Math.round(preferredWidth), minWidth, maxWidth),
  };
}

export default function AppShell({
  sections,
  activePage,
  onNavigate,
  selectedYears,
  onToggleYear,
  children,
}) {
  const [rejectedYear, setRejectedYear] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));
  const [sidebarWidth, setSidebarWidth] = useState(() => getSidebarBounds(typeof window === "undefined" ? 1440 : window.innerWidth).defaultWidth);
  const [hasManualSidebarWidth, setHasManualSidebarWidth] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [topBarOutlet, setTopBarOutlet] = useState(null);
  const rejectedYearTimeoutRef = useRef(null);
  const resizeStateRef = useRef(null);
  const resizeAnimationFrameRef = useRef(null);
  const pendingSidebarWidthRef = useRef(null);
  const topBarOutletRef = useCallback((node) => {
    setTopBarOutlet((current) => (current === node ? current : node));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (!storedWidth) return;

    const parsedWidth = Number.parseFloat(storedWidth);
    if (!Number.isFinite(parsedWidth)) return;

    const bounds = getSidebarBounds(window.innerWidth);
    setSidebarWidth(clamp(parsedWidth, bounds.minWidth, bounds.maxWidth));
    setHasManualSidebarWidth(true);
  }, []);

  useEffect(() => {
    const bounds = getSidebarBounds(viewportWidth);

    setSidebarWidth((currentWidth) => (
      hasManualSidebarWidth
        ? clamp(currentWidth, bounds.minWidth, bounds.maxWidth)
        : bounds.defaultWidth
    ));
  }, [hasManualSidebarWidth, viewportWidth]);

  useEffect(() => () => {
    if (rejectedYearTimeoutRef.current) {
      clearTimeout(rejectedYearTimeoutRef.current);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", handleSidebarPointerMove);
      window.removeEventListener("pointerup", stopSidebarResize);
      window.removeEventListener("pointercancel", stopSidebarResize);
    }
    if (resizeAnimationFrameRef.current) {
      cancelAnimationFrame(resizeAnimationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isResizingSidebar || typeof document === "undefined") return undefined;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizingSidebar]);

  useEffect(() => {
    if (!hasManualSidebarWidth || typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(sidebarWidth)));
  }, [hasManualSidebarWidth, sidebarWidth]);

  const handleToggleYear = (year) => {
    if (selectedYears.includes(year) && selectedYears.length === 1) {
      setRejectedYear(year);

      if (rejectedYearTimeoutRef.current) {
        clearTimeout(rejectedYearTimeoutRef.current);
      }

      rejectedYearTimeoutRef.current = setTimeout(() => {
        setRejectedYear(null);
        rejectedYearTimeoutRef.current = null;
      }, 360);

      return;
    }

    onToggleYear(year);
  };

  function handleSidebarPointerMove(event) {
    if (!resizeStateRef.current || typeof window === "undefined") return;

    const bounds = getSidebarBounds(window.innerWidth);
    pendingSidebarWidthRef.current = clamp(
      resizeStateRef.current.startWidth + (event.clientX - resizeStateRef.current.startX),
      bounds.minWidth,
      bounds.maxWidth
    );

    if (resizeAnimationFrameRef.current) return;

    resizeAnimationFrameRef.current = window.requestAnimationFrame(() => {
      resizeAnimationFrameRef.current = null;

      if (pendingSidebarWidthRef.current == null) return;
      setSidebarWidth(pendingSidebarWidthRef.current);
    });
  }

  function stopSidebarResize() {
    resizeStateRef.current = null;
    pendingSidebarWidthRef.current = null;
    setIsResizingSidebar(false);

    if (typeof window === "undefined") return;

    window.removeEventListener("pointermove", handleSidebarPointerMove);
    window.removeEventListener("pointerup", stopSidebarResize);
    window.removeEventListener("pointercancel", stopSidebarResize);
  }

  const beginSidebarResize = (event) => {
    if (typeof window === "undefined") return;

    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };

    setHasManualSidebarWidth(true);
    setIsResizingSidebar(true);
    window.addEventListener("pointermove", handleSidebarPointerMove);
    window.addEventListener("pointerup", stopSidebarResize);
    window.addEventListener("pointercancel", stopSidebarResize);
  };

  const resetSidebarWidth = () => {
    const bounds = getSidebarBounds(viewportWidth);
    setHasManualSidebarWidth(false);
    setSidebarWidth(bounds.defaultWidth);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE_KEY);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.mist, fontFamily: F.sans }}>
      <style>{`
        @keyframes sidebarShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
      <div
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          position: "relative",
          minWidth: 0,
          transition: isResizingSidebar ? "none" : "width 180ms ease",
          willChange: isResizingSidebar ? "width" : "auto",
        }}
      >
        <Sidebar
          sections={sections}
          activePage={activePage}
          onNavigate={onNavigate}
          selectedYears={selectedYears}
          onToggleYear={handleToggleYear}
          rejectedYear={rejectedYear}
          width={sidebarWidth}
        />
        <button
          type="button"
          aria-label="Resize sidebar"
          title="Drag to resize. Double-click to reset."
          onPointerDown={beginSidebarResize}
          onDoubleClick={resetSidebarWidth}
          style={{
            position: "absolute",
            top: 0,
            right: -8,
            width: 16,
            height: "100%",
            border: "none",
            padding: 0,
            background: "transparent",
            cursor: "col-resize",
            touchAction: "none",
            zIndex: 5,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 4,
              height: 76,
              transform: "translate(-50%, -50%)",
              borderRadius: 999,
              background: isResizingSidebar ? "rgba(90,173,186,.65)" : "rgba(138,155,181,.28)",
              boxShadow: isResizingSidebar ? "0 0 0 5px rgba(118,194,201,.14)" : "none",
              transition: "background-color .2s ease, box-shadow .2s ease",
            }}
          />
        </button>
      </div>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          minWidth: 0,
          background: "linear-gradient(180deg, #F5F8FB 0%, #EEF3F6 100%)",
        }}
      >
        <TopBarOutletContext.Provider value={topBarOutlet}>
          <div ref={topBarOutletRef} />
          <BlurFade
            key={activePage.id}
            duration={0.22}
            delay={0.05}
            offset={12}
            blur="10px"
            direction="up"
            style={{
              padding: "0 22px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "relative",
              minHeight: "100%",
            }}
          >
            {children}
          </BlurFade>
        </TopBarOutletContext.Provider>
      </main>
    </div>
  );
}
