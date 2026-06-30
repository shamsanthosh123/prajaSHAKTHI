import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Lang = "en" | "kn";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (en: string, kn: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  toggleLang: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("prajashakthi-language");
    return saved === "kn" ? "kn" : "en";
  });
  useEffect(() => {
    localStorage.setItem("prajashakthi-language", lang);
  }, [lang]);
  const toggleLang = () => setLang((l) => (l === "en" ? "kn" : "en"));
  const t = (en: string, kn: string) => (lang === "en" ? en : kn);
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
