import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "../lib/store";

const LanguageSync = () => {
  const lang = useSelector((state: RootState) => state.lang.lang);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return null;
};

export default LanguageSync;