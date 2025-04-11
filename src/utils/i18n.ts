import i18next from "i18next";
import middleware from "i18next-http-middleware";

import { translation as translationPT } from "@/locales/pt";

i18next.use(middleware.LanguageDetector).init({
  fallbackLng: "pt",
  resources: {
    pt: { translation: translationPT },
  },
});

export default i18next;
