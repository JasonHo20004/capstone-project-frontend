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
import { MoreHorizontal, Edit, Plus, Tag as TagIcon } from "lucide-react";
import { Tag } from "@/types/type";
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo tag");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật tag");
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
      header: "ID",
      accessor: "id" as keyof Tag,
      render: (tag: Tag) => (
        <span className="font-mono text-xs text-muted-foreground">
          {tag.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      header: "Tên Tag",
      accessor: "name" as keyof Tag,
      render: (tag: Tag) => (
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{tag.name}</span>
        </div>
      ),
    },
    {
      header: "",
      accessor: "id" as keyof Tag,
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
          icon={TagIcon}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <FilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm tag..."
        filters={[]}
      />

      <DataTable
        columns={columns}
        data={filteredTags}
        isLoading={isLoading}
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
