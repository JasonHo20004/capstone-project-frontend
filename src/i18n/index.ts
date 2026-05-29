import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enLanding from "./locales/en/landing.json";
import enLayout from "./locales/en/layout.json";
import enDashboard from "./locales/en/dashboard.json";
import enCourses from "./locales/en/courses.json";
import enAccount from "./locales/en/account.json";
import enExam from "./locales/en/exam.json";
import enInfo from "./locales/en/info.json";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viLanding from "./locales/vi/landing.json";
import viLayout from "./locales/vi/layout.json";
import viDashboard from "./locales/vi/dashboard.json";
import viCourses from "./locales/vi/courses.json";
import viAccount from "./locales/vi/account.json";
import viExam from "./locales/vi/exam.json";
import viInfo from "./locales/vi/info.json";

export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    landing: enLanding,
    layout: enLayout,
    dashboard: enDashboard,
    courses: enCourses,
    account: enAccount,
    exam: enExam,
    info: enInfo,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    landing: viLanding,
    layout: viLayout,
    dashboard: viDashboard,
    courses: viCourses,
    account: viAccount,
    exam: viExam,
    info: viInfo,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    ns: ["common", "auth", "landing", "layout", "dashboard", "courses", "account", "exam", "info"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "app-lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export default i18n;
