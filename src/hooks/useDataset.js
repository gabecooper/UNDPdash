import { useEffect, useState } from "react";
import { loadCsvRaw } from "../data/csvLoaders";

export function useDataset(page) {
  const [state, setState] = useState(() => ({
    status: page?.csvFile && page?.adapter ? "loading" : "success",
    data: null,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;

    if (!page?.csvFile || !page?.adapter) {
      setState({
        status: "success",
        data: null,
        error: null,
      });
      return undefined;
    }

    setState({
      status: "loading",
      data: null,
      error: null,
    });

    loadCsvRaw(page.csvFile)
      .then((raw) => {
        if (cancelled) return;
        setState({
          status: "success",
          data: page.adapter(raw),
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return state;
}
