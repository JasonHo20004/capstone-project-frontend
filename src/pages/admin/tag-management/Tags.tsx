import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import type { Tag } from "@/domain";
import DataTable from "@/components/admin/DataTable";
import FilterSection from "@/components/admin/FilterSection";
import StatCard from "@/components/admin/StatCard";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagService } from "@/lib/api/services/user/flashcard/tag.service";

export default function TagsManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const queryClient = useQueryClient();
  const [tagForm, setTagForm] = useState({
    name: "",
  });

  const { data: tagsResp, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagService.getAllTags(),
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagService.createTag({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setCreatingTag(false);
      setTagForm({ name: "" });
      toast.success("Tạo tag mới thành công!");
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) =>
      tagService.updateTag(tagId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingTag(null);
      setTagForm({ name: "" });
      toast.success("Cập nhật tag thành công!");
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => tagService.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setDeletingTag(null);
      toast.success("Đã xóa tag");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Không thể xóa tag";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (tagsResp?.data) {
      setTags(tagsResp.data);
    }
  }, [tagsResp]);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name });
  };

  const handleCreateTag = () => {
    if (!tagForm.name.trim()) {
      toast.error("Vui lòng nhập tên tag");
      return;
    }
    createTagMutation.mutate(tagForm.name);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    if (!tagForm.name.trim()) {
      toast.error("Vui lòng nhập tên tag");
      return;
    }
    updateTagMutation.mutate({ tagId: editingTag.id, name: tagForm.name });
  };

  const columns = [
    {
      key: "id" as keyof Tag,
      header: "ID",
      render: (tag: Tag) => (
        <span className="font-mono text-xs text-muted-foreground">
          {tag.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "name" as keyof Tag,
      header: "Tên Tag",
      render: (tag: Tag) => (
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{tag.name}</span>
        </div>
      ),
    },
    {
      key: "deckCount",
      header: "Đang dùng",
      render: (tag: Tag) =>
        tag.deckCount === undefined ? (
          <span className="text-muted-foreground text-sm">—</span>
        ) : tag.deckCount === 0 ? (
          <Badge variant="outline" className="text-muted-foreground">Chưa dùng</Badge>
        ) : (
          <Badge variant="secondary">{tag.deckCount} deck</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (tag: Tag) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(tag)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setDeletingTag(tag)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Tag</h1>
          <p className="text-muted-foreground">
            Quản lý các tag cho flashcard decks
          </p>
        </div>
        <Button onClick={() => setCreatingTag(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Tag Mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Tổng số Tag"
          value={tags.length}
          description="Đang dùng trong các flashcard decks"
          icon={TagIcon}
        />
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Lưu ý</p>
          Người dùng có thể tạo deck mới với tag tự chọn — hệ thống sẽ tự tạo tag chưa tồn tại.
          Admin chỉ cần can thiệp khi muốn đặt tên chuẩn cho tag phổ biến.
        </div>
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm tag..."
        filters={[]}
      />

      <DataTable
        columns={columns}
        data={filteredTags}
      />

      {/* Create Tag Dialog */}
      <Dialog open={creatingTag} onOpenChange={setCreatingTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Tag Mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo tag mới cho flashcard decks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tên Tag</Label>
              <Input
                id="tag-name"
                placeholder="Ví dụ: Travel, Business, Education..."
                value={tagForm.name}
                onChange={(e) =>
                  setTagForm({ ...tagForm, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreatingTag(false);
                setTagForm({ name: "" });
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={createTagMutation.isPending}
            >
              {createTagMutation.isPending ? "Đang tạo..." : "Tạo Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tag <strong>"{deletingTag?.name}"</strong> sẽ bị xóa khỏi hệ thống.
              {deletingTag?.deckCount && deletingTag.deckCount > 0 ? (
                <span className="block mt-2 text-amber-600">
                  ⚠️ Tag này đang được dùng bởi <strong>{deletingTag.deckCount} deck</strong>.
                  Sau khi xóa, các deck đó sẽ mất tag liên kết.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTagMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTagMutation.isPending}
              onClick={() => deletingTag && deleteTagMutation.mutate(deletingTag.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteTagMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tag</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tag
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Tên Tag</Label>
              <Input
                id="edit-tag-name"
                placeholder="Nhập tên tag"
                value={tagForm.name}
                onChange={(e) =>
                  setTagForm({ ...tagForm, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTag(null);
                setTagForm({ name: "" });
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
