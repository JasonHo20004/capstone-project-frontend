import type {
  GeneratedPlan,
  LearnerProfile,
  PersonalizationLevel,
  SkillPriority,
  WeeklyTask,
  DayOfWeek,
  SkillKey,
} from "./types";

const SKILL_REASON: Record<SkillKey, string> = {
  Listening:
    "Listening is prioritized because you selected it as your weakest skill and it has high impact on your target exam.",
  Reading:
    "Reading is included early because it builds vocabulary in context and supports writing.",
  Writing:
    "Writing requires structured practice and feedback loops, so it gets dedicated sessions.",
  Speaking:
    "Speaking improves fastest with frequent short sessions and recording-based feedback.",
  Vocabulary:
    "Vocabulary is foundational for every other skill, so we layer it into daily reviews.",
  Grammar:
    "Grammar accuracy directly affects writing and speaking band scores.",
};

const SKILL_ORDER: SkillKey[] = [
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Vocabulary",
  "Grammar",
];

function deriveSkillPriorities(profile: LearnerProfile): SkillPriority[] {
  const weakest =
    profile.weakestSkill !== "Not sure" ? profile.weakestSkill : null;

  const ordered: SkillKey[] = weakest
    ? [weakest, ...SKILL_ORDER.filter((s) => s !== weakest)]
    : ["Listening", "Vocabulary", "Reading", "Writing", "Speaking", "Grammar"];

  return ordered.slice(0, 5).map((skill, idx) => ({
    skill,
    rank: idx + 1,
    intensity: idx === 0 ? "High" : idx <= 2 ? "Medium" : "Low",
    reason:
      idx === 0 && weakest
        ? SKILL_REASON[skill]
        : SKILL_REASON[skill] ??
          "Included in your roadmap to keep skills balanced.",
  }));
}

function derivePersonalization(profile: LearnerProfile): {
  level: PersonalizationLevel;
  reason: string;
} {
  const hasGoal = Boolean(profile.targetScore && profile.targetExam);
  const hasLifestyle = Boolean(
    profile.weeklyStudyHours && profile.availableDays.length > 0,
  );
  const hasPreferences = Boolean(
    profile.weakestSkill && profile.learningPreference.length > 0,
  );

  if (profile.cefrLevel && hasGoal && hasLifestyle && hasPreferences) {
    return {
      level: "Good",
      reason:
        "Based on your placement result, target score, weekly study time, weakest skill and learning preferences.",
    };
  }
  if (profile.cefrLevel && (hasGoal || hasLifestyle)) {
    return {
      level: "Basic",
      reason:
        "Based on your placement result and goal. Complete a skill diagnostic to improve plan accuracy.",
    };
  }
  return {
    level: "Basic",
    reason:
      "Limited data so far. Take a placement test and add your study habits to unlock a more personalized plan.",
  };
}

function buildWeeklyPlan(profile: LearnerProfile): WeeklyTask[] {
  const sessionMin = parseInt(profile.preferredSessionLength, 10) || 30;
  const days: DayOfWeek[] = profile.availableDays.length
    ? profile.availableDays
    : ["Monday", "Wednesday", "Friday", "Sunday"];

  const priorities = deriveSkillPriorities(profile).map((p) => p.skill);
  const taskTemplates: Array<Pick<WeeklyTask, "title" | "type" | "skill">> = [
    {
      title: "Targeted vocabulary review",
      type: "Vocabulary",
      skill: "Vocabulary",
    },
    {
      title: "Listening: main ideas + note taking",
      type: "Listening",
      skill: priorities[0] ?? "Listening",
    },
    {
      title: "Reading strategy + timed passage",
      type: "Reading",
      skill: "Reading",
    },
    {
      title: "Speaking shadowing + recording",
      type: "Speaking",
      skill: "Speaking",
    },
    {
      title: "Writing task with feedback checklist",
      type: "Writing",
      skill: "Writing",
    },
    {
      title: "Full practice test + review",
      type: "Mock test",
      skill: priorities[0] ?? "Listening",
    },
    {
      title: "Skill review + reflection",
      type: "Review",
      skill: "Grammar",
    },
  ];

  return days.map((day, idx) => {
    const tpl = taskTemplates[idx % taskTemplates.length];
    const duration =
      tpl.type === "Mock test" ? Math.max(sessionMin, 60) : sessionMin;
    return {
      day,
      title: tpl.title,
      type: tpl.type,
      skill: tpl.skill,
      durationMinutes: duration,
    };
  });
}

function estimateGap(profile: LearnerProfile): GeneratedPlan["gapAnalysis"] {
  const cefr = profile.cefrLevel ?? "A2";
  const target = profile.targetScore || "—";
  const ielts = parseFloat(profile.targetScore || "0");
  const months =
    profile.deadline === "1 month"
      ? 1
      : profile.deadline === "3 months"
      ? 3
      : profile.deadline === "6 months"
      ? 6
      : profile.deadline === "12 months"
      ? 12
      : 6;

  const isAggressive =
    profile.targetExam === "IELTS" &&
    ielts >= 7 &&
    (cefr === "A1" || cefr === "A2" || cefr === "B1") &&
    months <= 3;

  return {
    currentLevel: cefr,
    targetLabel: `${profile.targetExam} ${target}`,
    gap: isAggressive ? "High" : "Medium",
    feasibility: isAggressive ? "Very challenging" : "Achievable",
    recommendation: isAggressive
      ? "Consider extending the deadline or starting with a slightly lower target band."
      : `Keep current target. Study around ${profile.weeklyStudyHours || "6-8"} hours per week for steady progress.`,
    warning: isAggressive
      ? "This goal may be challenging with your current timeline. You can still continue, but we recommend a more intensive plan."
      : undefined,
  };
}

export function buildMockPlan(profile: LearnerProfile): GeneratedPlan {
  const personalization = derivePersonalization(profile);
  const skillPriorities = deriveSkillPriorities(profile);
  const gapAnalysis = estimateGap(profile);
  const weeklyPlan = buildWeeklyPlan(profile);

  const topSkill = skillPriorities[0]?.skill ?? "Listening";

  return {
    summary: {
      currentLevel: profile.cefrLevel ?? "—",
      targetExam: profile.targetExam,
      targetScore: profile.targetScore || "—",
      deadline:
        profile.deadline === "Custom"
          ? profile.customDeadline ?? "Custom"
          : profile.deadline,
      weeklyStudyHours: profile.weeklyStudyHours,
      studyIntensity: profile.studyIntensity,
      weakestSkill: profile.weakestSkill,
      estimatedDifficulty:
        gapAnalysis.feasibility === "Very challenging"
          ? "High"
          : gapAnalysis.feasibility === "Challenging"
          ? "Medium-high"
          : "Medium",
      estimatedWeeklyWorkload: `${profile.weeklyStudyHours} hours • ${profile.studyIntensity.toLowerCase()} intensity`,
    },
    personalizationLevel: personalization.level,
    personalizationReason: personalization.reason,
    gapAnalysis,
    skillPriorities,
    phases: [
      {
        id: "phase-1",
        title: "Foundation",
        weeks: "Weeks 1–3",
        focus: [topSkill, "Vocabulary"],
        description:
          "Stabilize fundamentals: high-frequency vocabulary, listening for gist, and exam format orientation.",
      },
      {
        id: "phase-2",
        title: "Skill building",
        weeks: "Weeks 4–10",
        focus: skillPriorities.slice(0, 3).map((p) => p.skill),
        description:
          "Layer in timed practice and skill-specific strategies. Begin weekly self-assessment.",
      },
      {
        id: "phase-3",
        title: "Exam simulation",
        weeks: "Final 4 weeks",
        focus: skillPriorities.slice(0, 4).map((p) => p.skill),
        description:
          "Run full-length practice tests with reflection, focused remediation, and pacing.",
      },
    ],
    weeklyPlan,
    recommendedLessons: [
      {
        id: "l1",
        title: `${topSkill}: main ideas & note taking`,
        type: "Lesson",
        skill: topSkill,
        estimatedMinutes: 35,
        difficulty: "Intermediate",
        cta: "Start",
      },
      {
        id: "l2",
        title: "IELTS Vocabulary Basics",
        type: "Course",
        skill: "Vocabulary",
        estimatedMinutes: 45,
        difficulty: "Beginner",
        cta: "Start",
      },
      {
        id: "l3",
        title: "Reading: skimming strategy",
        type: "Lesson",
        skill: "Reading",
        estimatedMinutes: 30,
        difficulty: "Intermediate",
        cta: "Add to plan",
      },
    ],
    recommendedFlashcards: [
      {
        id: "f1",
        title: "Academic Word List — Set 1",
        type: "Flashcard",
        skill: "Vocabulary",
        estimatedMinutes: 15,
        difficulty: "Beginner",
        cta: "Practice",
      },
      {
        id: "f2",
        title: "Listening collocations B1",
        type: "Flashcard",
        skill: "Listening",
        estimatedMinutes: 15,
        difficulty: "Intermediate",
        cta: "Practice",
      },
    ],
    recommendedQuizzes: [
      {
        id: "q1",
        title: "Listening Mini Quiz B1",
        type: "Quiz",
        skill: "Listening",
        estimatedMinutes: 20,
        difficulty: "Intermediate",
        cta: "Start",
      },
      {
        id: "q2",
        title: "Reading Practice Test 01",
        type: "Practice Test",
        skill: "Reading",
        estimatedMinutes: 60,
        difficulty: "Intermediate",
        cta: "Start",
      },
    ],
    explanation: `This plan focuses on ${topSkill}${
      profile.weakestSkill === "Not sure" ? "" : " and Vocabulary"
    } first because you are currently at ${
      profile.cefrLevel ?? "an early"
    } level, your target is ${profile.targetExam} ${
      profile.targetScore || "your chosen score"
    }, and ${
      profile.weakestSkill === "Not sure"
        ? "we haven't identified a specific weak skill yet"
        : `you selected ${profile.weakestSkill} as your weakest skill`
    }. The roadmap starts with foundation work before moving into timed practice and mock tests.`,
  };
}
