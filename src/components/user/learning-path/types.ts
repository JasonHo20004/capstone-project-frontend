export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type ExamType = "IELTS" | "TOEIC" | "TOEFL" | "CEFR" | "General";

export type DeadlineOption =
  | "1 month"
  | "3 months"
  | "6 months"
  | "12 months"
  | "Custom";

export type WeeklyHoursOption = "2-3" | "4-5" | "6-8" | "10+";

export type StudyIntensity = "Light" | "Standard" | "Intensive";

export type SkillKey =
  | "Listening"
  | "Reading"
  | "Writing"
  | "Speaking"
  | "Vocabulary"
  | "Grammar";

export type WeakestSkillOption = SkillKey | "Not sure";

export type LearningPreference =
  | "Video lessons"
  | "Flashcards"
  | "Practice exercises"
  | "Mock tests"
  | "Reading materials"
  | "Mixed";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type SessionLength = "15" | "30" | "45" | "60" | "90";

export type ReminderPreference =
  | "None"
  | "Daily"
  | "Weekly"
  | "Before session";

export type PreviousExamExperience =
  | "Never"
  | "Once"
  | "Multiple"
  | "MockOnly";

export type Confidence = "Low" | "Medium" | "High";

export type PersonalizationLevel = "Basic" | "Good" | "High";

export type Feasibility = "Achievable" | "Challenging" | "Very challenging";

export type GapSize = "Low" | "Medium" | "Medium-high" | "High";

export interface PlacementBaseline {
  cefrLevel: CefrLevel | null;
  takenAt: string | null;
  skillBreakdown?: Partial<Record<SkillKey, number>>;
}

export interface LearnerProfile {
  cefrLevel: CefrLevel | null;
  placementTakenAt: string | null;
  targetExam: ExamType;
  targetScore: string;
  deadline: DeadlineOption;
  customDeadline?: string;
  reasonForStudying: string;
  weeklyStudyHours: WeeklyHoursOption;
  availableDays: DayOfWeek[];
  preferredSessionLength: SessionLength;
  studyIntensity: StudyIntensity;
  reminderPreference: ReminderPreference;
  weakestSkill: WeakestSkillOption;
  learningPreference: LearningPreference[];
  previousExamExperience: PreviousExamExperience;
  previousExamScore?: string;
  confidence: Confidence;
}

export interface SkillPriority {
  skill: SkillKey;
  rank: number;
  intensity: "High" | "Medium" | "Low";
  reason: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  weeks: string;
  focus: SkillKey[];
  description: string;
}

export interface RecommendedItem {
  id: string;
  title: string;
  type: "Course" | "Lesson" | "Flashcard" | "Quiz" | "Practice Test";
  skill: SkillKey;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  cta: "Start" | "Add to plan" | "Practice";
}

export interface WeeklyTask {
  day: DayOfWeek;
  title: string;
  type: "Vocabulary" | "Listening" | "Reading" | "Writing" | "Speaking" | "Mock test" | "Review";
  durationMinutes: number;
  skill: SkillKey;
}

export interface GapAnalysis {
  currentLevel: string;
  targetLabel: string;
  gap: GapSize;
  feasibility: Feasibility;
  recommendation: string;
  warning?: string;
}

export interface PlanSummary {
  currentLevel: string;
  targetExam: ExamType;
  targetScore: string;
  deadline: string;
  weeklyStudyHours: WeeklyHoursOption;
  studyIntensity: StudyIntensity;
  weakestSkill: WeakestSkillOption;
  estimatedDifficulty: "Low" | "Medium" | "Medium-high" | "High";
  estimatedWeeklyWorkload: string;
}

export interface GeneratedPlan {
  summary: PlanSummary;
  personalizationLevel: PersonalizationLevel;
  personalizationReason: string;
  gapAnalysis: GapAnalysis;
  skillPriorities: SkillPriority[];
  phases: PlanPhase[];
  weeklyPlan: WeeklyTask[];
  recommendedLessons: RecommendedItem[];
  recommendedFlashcards: RecommendedItem[];
  recommendedQuizzes: RecommendedItem[];
  explanation: string;
}

export type WizardStep = 1 | 2 | 3 | 4;
