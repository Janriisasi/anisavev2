import { createContext } from "react";

export const TutorialLangContext = createContext({
  lang: "en",
  setLang: () => {},
});