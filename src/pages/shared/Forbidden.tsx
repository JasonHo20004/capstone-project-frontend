import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Home, ShieldX } from "lucide-react";

import { ErrorPage } from "@/components/shared/ErrorPage";

/** 403 — user is signed in but lacks permission for this resource. */
const Forbidden = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <ErrorPage
      code="403"
      accent="amber"
      icon={ShieldX}
      status={t("error.forbidden.status")}
      title={t("error.forbidden.title")}
      message={t("error.forbidden.message")}
      documentTitle={`403 ${t("error.forbidden.status")} | ${t("app.name")}`}
      actions={[
        { label: t("error.backHome"), icon: Home, variant: "accent", to: "/" },
        { label: t("error.goBack"), icon: ArrowLeft, variant: "outline", onClick: () => navigate(-1) },
      ]}
      helpLabel={t("error.needHelp")}
      helpHref="/contact"
    />
  );
};

export default Forbidden;
