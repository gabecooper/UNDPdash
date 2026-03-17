import { useEffect, useState } from "react";

function getCurrentPathname() {
  return window.location.pathname || "/";
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
    const currentPath = getCurrentPathname();
    if (currentPath === nextPath) return;

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", nextPath);
    setPathname(nextPath);
  };

  return {
    pathname,
    navigate,
    replace: (nextPath) => navigate(nextPath, { replace: true }),
  };
}
