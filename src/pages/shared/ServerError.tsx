import { useTranslation } from "react-i18next";
import { Home, RotateCw, ServerCrash } from "lucide-react";

import { ErrorPage } from "@/components/shared/ErrorPage";

/**
 * 500 — something failed on the server. Red carries the severity (numeral,
 * chip, blooms); the primary CTA stays the brand-blue "Try again" so retrying
 * reads as a safe, inviting action rather than a destructive one.
 */
const ServerError = () => {
  const { t } = useTranslation("common");

  return (
    <ErrorPage
      code="500"
      accent="red"
      icon={ServerCrash}
      status={t("error.serverError.status")}
      title={t("error.serverError.title")}
      message={t("error.serverError.message")}
      documentTitle={`500 ${t("error.serverError.status")} | ${t("app.name")}`}
      actions={[
        { label: t("error.tryAgain"), icon: RotateCw, variant: "primary", onClick: () => window.location.reload() },
        { label: t("error.backHome"), icon: Home, variant: "outline", to: "/" },
      ]}
      helpLabel={t("error.needHelp")}
      helpHref="/contact"
    />
  );
};

export default ServerError;
