import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type Tab = {
  id: "overview" | "comments" | "reviews";
  labelKey: "overview" | "comments" | "reviews";
};

const tabs: Tab[] = [
  { id: "overview", labelKey: "overview" },
  { id: "comments", labelKey: "comments" },
  { id: "reviews", labelKey: "reviews" },
];

type LearningTabsProps = {
  activeTab: Tab["id"];
  onTabChange: (tab: Tab["id"]) => void;
};

export const LearningTabs = ({ activeTab, onTabChange }: LearningTabsProps) => {
  const { t } = useTranslation("courses");
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border bg-muted/40 p-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-background text-muted-foreground hover:bg-primary/10"
          )}
        >
          {t(`studentLearning.learningTabs.${tab.labelKey}`)}
        </button>
      ))}
    </div>
  );
};

export type LearningTabId = Tab["id"];
