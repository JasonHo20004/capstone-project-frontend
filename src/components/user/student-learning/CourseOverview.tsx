import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import type { CourseContext } from "@/types/student-learning";

type CourseOverviewProps = {
  context?: CourseContext;
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const CourseOverview = ({ context }: CourseOverviewProps) => {
  if (!context) {
    return (
      <div className="rounded-3xl border bg-background p-6 text-sm text-muted-foreground">
        Chọn một khóa học và bài học để xem thông tin tổng quan.
      </div>
    );
  }

  const { course, progress, syllabus } = context;

  const totalDuration = syllabus.reduce(
    (sum, item) => sum + (item.durationInSeconds ?? 0),
    0
  );
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{course.title}</h2>
          {course.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {course.category && (
              <Badge variant="outline" className="rounded-full">
                {course.category}
              </Badge>
            )}
            {course.courseLevel && (
              <Badge variant="secondary" className="rounded-full">
                {levelLabels[course.courseLevel] ?? course.courseLevel}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-full">
              {course.totalLessons} bài học
            </Badge>
            <Badge variant="outline" className="rounded-full">
              ~{totalMinutes || 0} phút nội dung
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Tiến độ khóa học</p>
            <span className="text-xs text-muted-foreground">
              {progress.completedLessons}/{progress.totalLessons} bài học
            </span>
          </div>
          <Progress value={progress.progressPercentage} />
          <p className="text-xs text-muted-foreground">
            Bạn đã hoàn thành {progress.progressPercentage}% khóa học này.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4">
          <Avatar className="h-12 w-12 border">
            {course.instructor.profilePicture && (
              <AvatarImage src={course.instructor.profilePicture} alt={course.instructor.fullName} />
            )}
            <AvatarFallback>
              {course.instructor.fullName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Giảng viên</p>
            <p className="text-sm leading-tight">{course.instructor.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {course.totalRatings} đánh giá từ học viên
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Bạn sẽ học được gì?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sử dụng danh sách bài học ở bên phải để điều hướng qua từng nội dung
          chi tiết. Mỗi bài học có thể bao gồm video, tài liệu đính kèm và khu vực
          hỏi đáp để bạn tương tác với cộng đồng.
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cập nhật lần cuối: {formatDate(new Date().toISOString())}
      </p>
    </div>
  );
};


