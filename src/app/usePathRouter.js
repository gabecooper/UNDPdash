import { useEffect, useState } from "react";

function getBasePath() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  if (!baseUrl || baseUrl === "/") return "";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizeRoutePath(pathname) {
  if (!pathname) return "/";

  const basePath = getBasePath();
  if (!basePath) return pathname || "/";
  if (pathname === basePath || pathname === `${basePath}/`) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname || "/";
}

function toBrowserPath(routePath) {
  const normalizedRoutePath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const basePath = getBasePath();
  if (!basePath) return normalizedRoutePath;
  return `${basePath}${normalizedRoutePath}`;
}

function getCurrentPathname() {
  return normalizeRoutePath(window.location.pathname);
}

export function usePathRouter() {
  const [pathname, setPathname] = useState(getCurrentPathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getCurrentPathname());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath, { replace = false } = {}) => {
    const normalizedNextPath = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    const currentPath = getCurrentPathname();
    if (currentPath === normalizedNextPath) return;

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", toBrowserPath(normalizedNextPath));
    setPathname(normalizedNextPath);
  };

  return {
    pathname,
    navigate,
    replace: (nextPath) => navigate(nextPath, { replace: true }),
  };
}
