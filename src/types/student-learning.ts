export interface LessonMediaAsset {
  id: string;
  assetType: string;
  assetUrl: string;
}

export interface LessonPlayer {
  id: string;
  title: string;
  description: string | null;
  durationInSeconds: number | null;
  lessonOrder: number | null;
  courseId: string;
  courseTitle: string;
  mediaAssets: LessonMediaAsset[];
  recentComments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      profilePicture: string | null;
    };
  }>;
}

export interface SyllabusItem {
  id: string;
  title: string;
  description: string | null;
  durationInSeconds: number | null;
  lessonOrder: number | null;
  materials: string[];
  commentCount: number | null;
  isCompleted?: boolean;
}

export interface CourseContext {
  course: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    courseLevel: string | null;
    instructor: {
      id: string;
      fullName: string;
      profilePicture: string | null;
    };
    totalLessons: number;
    totalRatings: number;
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
  };
  syllabus: SyllabusItem[];
}

export interface LessonComment {
  id: string;
  content: string;
  createdAt: string;
  parentCommentId: string | null;
  user: {
    id: string;
    fullName: string;
    profilePicture: string | null;
  };
}

export interface LessonCommentsResponse {
  comments: LessonComment[];
  total: number;
  page: number;
  limit: number;
}

export interface RatingResponse {
  id: string;
  score: number;
  content: string | null;
  createdAt: string;
  replyContent: string | null;
  repliedAt: string | null;
  user: {
    id: string;
    fullName: string;
    profilePicture: string | null;
  };
}

export interface CourseRatingsResponse {
  ratings: RatingResponse[];
  total: number;
  averageScore: number;
  page: number;
  limit: number;
}

