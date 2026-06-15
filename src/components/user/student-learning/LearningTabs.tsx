import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, MessagesSquare, Star, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tab = {
  id: "overview" | "comments" | "reviews";
  labelKey: "overview" | "comments" | "reviews";
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { id: "overview", labelKey: "overview", icon: BookOpen },
  { id: "comments", labelKey: "comments", icon: MessagesSquare },
  { id: "reviews", labelKey: "reviews", icon: Star },
];

type LearningTabsProps = {
  activeTab: Tab["id"];
  onTabChange: (tab: Tab["id"]) => void;
};

export const LearningTabs = ({ activeTab, onTabChange }: LearningTabsProps) => {
  const { t } = useTranslation("courses");
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="relative flex flex-wrap gap-1.5 rounded-2xl border border-border/10 bg-surface-lowest/80 p-1.5 shadow-sm backdrop-blur-md">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="learning-tab-pill"
                className="absolute inset-0 -z-0 rounded-full bg-primary shadow-md shadow-primary/25"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
            <Icon className={cn("relative z-10 h-4 w-4 transition-transform duration-300", isActive ? "scale-100" : "scale-90")} />
            <span className="relative z-10">
              {t(`studentLearning.learningTabs.${tab.labelKey}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export type LearningTabId = Tab["id"];
