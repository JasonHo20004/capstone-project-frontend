import { useTranslation } from "react-i18next";
import { Home, Lock, LogIn } from "lucide-react";

import { ErrorPage } from "@/components/shared/ErrorPage";

/** 401 — user is not authenticated and must sign in. */
const Unauthorized = () => {
  const { t } = useTranslation("common");

  return (
    <ErrorPage
      code="401"
      accent="blue"
      icon={Lock}
      status={t("error.unauthorized.status")}
      title={t("error.unauthorized.title")}
      message={t("error.unauthorized.message")}
      documentTitle={`401 ${t("error.unauthorized.status")} | ${t("app.name")}`}
      actions={[
        { label: t("error.signIn"), icon: LogIn, variant: "primary", to: "/login" },
        { label: t("error.backHome"), icon: Home, variant: "outline", to: "/" },
      ]}
      helpLabel={t("error.needHelp")}
      helpHref="/contact"
    />
  );
};

export default Unauthorized;
