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
    <div className="relative flex flex-wrap gap-2 rounded-2xl border border-border/10 bg-surface-lowest/80 p-2 shadow-sm backdrop-blur-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ease-out",
            activeTab === tab.id
              ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
              : "bg-transparent text-muted-foreground hover:bg-surface-low hover:text-foreground scale-95 hover:scale-100"
          )}
        >
          {t(`studentLearning.learningTabs.${tab.labelKey}`)}
        </button>
      ))}
    </div>
  );
};

export type LearningTabId = Tab["id"];
