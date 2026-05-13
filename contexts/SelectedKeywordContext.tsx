import { createContext, useContext, useState } from "react";

type SelectedKeyword = {
  keyword: string;
  score: number;
  region: string;
  snapshotId: number | null;
} | null;

type SelectedKeywordContextType = {
  selected: SelectedKeyword;
  setSelected: (s: SelectedKeyword) => void;
};

const SelectedKeywordContext = createContext<SelectedKeywordContextType>({
  selected: null,
  setSelected: () => {},
});

export function SelectedKeywordProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<SelectedKeyword>(null);
  return (
    <SelectedKeywordContext value={{ selected, setSelected }}>
      {children}
    </SelectedKeywordContext>
  );
}

export function useSelectedKeyword() {
  return useContext(SelectedKeywordContext);
}
