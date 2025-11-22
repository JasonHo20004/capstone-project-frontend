import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { courseManagementService } from "@/lib/api/services/admin";
import type { UpdateCourseRequest } from "@/lib/api/services/admin";
import { CourseWithStats, CourseStatus, CourseLevel } from "@/types/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newLesson, setNewLesson] = useState({ title: "", description: "" });
  const [replyText, setReplyText] = useState("");
  const [editCourse, setEditCourse] = useState<UpdateCourseRequest>({});
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false);

  const { data: courseDetailResp } = useQuery({
    queryKey: ["adminCourseDetail", id],
    queryFn: () => courseManagementService.getCourseById(id!),
    enabled: !!id,
  });

  const { data: lessonsResp } = useQuery({
    queryKey: ["adminCourseLessons", id],
    queryFn: () => courseManagementService.getLessons(id!),
    enabled: !!id && activeTab === "lessons",
  });

  const { data: ratingsResp } = useQuery({
    queryKey: ["adminCourseRatings", id],
    queryFn: () => courseManagementService.getRatings(id!),
    enabled: !!id && activeTab === "ratings",
  });

  const updateCourseMutation = useMutation({
    mutationFn: (vars: { data: UpdateCourseRequest }) =>
      courseManagementService.updateCourse(id!, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourseDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => courseManagementService.deleteCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setShowDeleteCourseDialog(false); // Close dialog on success
      navigate("/admin/courses");
    },
  });

  const handleDeleteCourse = () => {
    deleteCourseMutation.mutate();
  };

  const createLessonMutation = useMutation({
    mutationFn: (vars: { title: string; description?: string }) =>
      courseManagementService.createLesson(id!, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourseDetail", id] });
      setNewLesson({ title: "", description: "" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: (vars: { lessonId: string; data: any }) =>
      courseManagementService.updateLesson(id!, vars.lessonId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourseDetail", id] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) =>
      courseManagementService.deleteLesson(id!, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourseDetail", id] });
      setLessonToDelete(null); // Close dialog on success
    },
  });

  const handleDeleteLesson = () => {
    if (lessonToDelete) {
      deleteLessonMutation.mutate(lessonToDelete);
    }
  };

  const deleteRatingMutation = useMutation({
    mutationFn: (ratingId: string) =>
      courseManagementService.deleteRating(id!, ratingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourseRatings", id] });
      queryClient.refetchQueries({
        queryKey: ["adminCourseRatings", id],
        type: 'active'
      });
    },
  });


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="default">Đã xuất bản</Badge>;
      case "ACTIVE":
        return <Badge variant="default">Hoạt động</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "REFUSE":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "INACTIVE":
        return <Badge variant="outline">Không hoạt động</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const course = courseDetailResp?.data;
  useEffect(() => {
    if (course) {
      setEditCourse({
        title: course.title,
        description: course.description,
        price: course.price,
        courseLevel: course.courseLevel,
        status: course.status,
      });
    }
  }, [course]);
  return (
    <div className="space-y-6">
      {course && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{course.title}</h2>
              <div className="text-sm text-muted-foreground">
                Người bán: {(course as any).user?.fullName || "N/A"} •
                Level: {course.courseLevel || "N/A"} • Giá:{" "}
                {formatCurrency(course.price)}
              </div>
            </div>
            <div>
              {getStatusBadge(course.status)}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setSearchParams((prev) => {
                const np = new URLSearchParams(prev);
                np.set("tab", v);
                return np;
              });
            }}
          >
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="lessons">Bài học</TabsTrigger>
              <TabsTrigger value="ratings">Đánh giá</TabsTrigger>
              <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded border p-4 space-y-2">
                {course.description && (
                  <div className="text-sm text-muted-foreground">
                    Mô tả: {course.description}
                  </div>
                )}
                <div className="text-sm">
                  Đánh giá TB: {(course as CourseWithStats).averageRating ?? "N/A"} (
                  {course.ratingCount ?? 0})
                </div>
                 <div className="text-sm">
                  Tổng số bài học: {(course as CourseWithStats).lessonsCount ?? "N/A"}
                </div>
                 <div className="text-sm">
                  Tổng số đánh giá: {(course as CourseWithStats).ratingsCount ?? "N/A"}
                </div>
                <div className="text-sm">
                  Ngày tạo: {new Date(course.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteCourseDialog(true)}
                >
                  Xóa khóa học
                </Button>
                {course.status === CourseStatus.PENDING && (
                  <>
                    <Button
                      onClick={() =>
                        updateCourseMutation.mutate({
                          data: { status: CourseStatus.ACTIVE },
                        })
                      }
                    >
                      Duyệt khóa học
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateCourseMutation.mutate({
                          data: { status: CourseStatus.REFUSE },
                        })
                      }
                    >
                      Từ chối
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              {course && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Tiêu đề</Label>
                      <Input
                        id="courseTitle"
                        value={editCourse.title ?? ""}
                        onChange={(e) =>
                          setEditCourse({ ...editCourse, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coursePrice">Giá</Label>
                      <Input
                        id="coursePrice"
                        type="number"
                        value={
                          editCourse.price === undefined
                            ? ""
                            : String(editCourse.price)
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditCourse({
                            ...editCourse,
                            price: v === "" ? undefined : Number(v),
                          });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="courseDesc">Mô tả</Label>
                      <Textarea
                        id="courseDesc"
                        rows={4}
                        value={editCourse.description ?? ""}
                        onChange={(e) =>
                          setEditCourse({
                            ...editCourse,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trình độ</Label>
                      <Select
                        value={editCourse.courseLevel ?? undefined}
                        onValueChange={(v) =>
                          setEditCourse({
                            ...editCourse,
                            courseLevel: v as UpdateCourseRequest["courseLevel"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trình độ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="A2">A2</SelectItem>
                          <SelectItem value="B1">B1</SelectItem>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C2">C2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <Select
                        value={editCourse.status ?? undefined}
                        onValueChange={(v) =>
                          setEditCourse({
                            ...editCourse,
                            status: v as UpdateCourseRequest["status"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                          <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                          <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                          <SelectItem value="REFUSE">Từ chối</SelectItem>
                          <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        updateCourseMutation.mutate({ data: editCourse })
                      }
                      disabled={!editCourse.title || editCourse.price === undefined}
                    >
                      Lưu thay đổi
                    </Button>
                    {/* <Button
                      variant="outline"
                      onClick={() =>
                        setEditCourse({
                          title: course.title,
                          description: course.description,
                          price: course.price,
                          courseLevel: course.courseLevel,
                          status: course.status,
                        })
                      }
                    >
                      Hoàn nguyên
                    </Button> */}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <div className="space-y-2">
                {(courseDetailResp?.data?.lessons || []).map((ls: any) => (
                  <div
                    key={ls.id}
                    className="flex items-center justify-between border rounded p-3"
                  >
                    <div>
                      <div className="font-medium">{ls.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {ls.description}
                      </div>
                      <div className="text-sm">
                        Bình luận: {ls.commentCount || 0}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/lessons/${ls.id}?courseId=${id}`)}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setLessonToDelete(ls.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-4">
              <div className="space-y-2">
                {(ratingsResp?.data?.ratings || []).map((rt: any) => (
                  <div key={rt.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Điểm: {rt.score} • Người dùng:{" "}
                        {rt.user?.fullName || rt.userId}
                      </div>
                    </div>
                    {rt.content && (
                      <div className="text-sm text-muted-foreground">
                        {rt.content}
                      </div>
                    )}
                   
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLessonToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteCourseDialog} onOpenChange={setShowDeleteCourseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khóa học này? Tất cả bài học và dữ liệu liên quan sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteCourseDialog(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
