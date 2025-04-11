import "i18next";
import { translation as translationPT } from "@/locales/pt";

type TranslationType = typeof translationPT;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: TranslationType;
    };
  }
}
