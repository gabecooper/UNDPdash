import { createContext, useContext } from "react";

export const TopBarOutletContext = createContext(null);

export function useTopBarOutlet() {
  return useContext(TopBarOutletContext);
}
