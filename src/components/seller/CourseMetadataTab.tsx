import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { CourseLevel, CourseStatus } from '@/domain';

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: CourseLevel;
  status: CourseStatus;
}>;

interface StatusInfo {
  label: string;
  emoji: string;
  bg: string;
  text: string;
}

interface Props {
  course: any;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onSave: () => void;
  onClearDraft: () => void;
  isSaving: boolean;
  statusConfig: Record<string, StatusInfo>;
}

export function CourseMetadataTab({
  course,
  draft,
  setDraft,
  onSave,
  onClearDraft,
  isSaving,
  statusConfig,
}: Props) {
  const merged = { ...course, ...draft };
  const st = statusConfig[merged.status] ?? statusConfig.DRAFT;
  const isDirty = Object.keys(draft).length > 0;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return (
    <>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cập nhật khóa học</h2>
          <p className="text-sm text-slate-500">Chỉnh sửa thông tin và trạng thái khóa học</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
                <Input
                  className="rounded-xl h-11"
                  value={draft.title ?? merged.title ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  maxLength={100}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-slate-400">
                    {(draft.title ?? merged.title ?? '').length}/100
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Giá (VNĐ)</label>
                <Input
                  className="rounded-xl h-11"
                  type="number"
                  value={draft.price ?? merged.price ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Level</label>
                <Select
                  value={draft.courseLevel ?? merged.courseLevel ?? ''}
                  onValueChange={(v) => setDraft((d) => ({ ...d, courseLevel: v as CourseLevel }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Chọn level" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lv) => (
                      <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                    {st.emoji} {st.label}
                  </span>
                  {(['DRAFT', 'REFUSE', 'INACTIVE'] as string[]).includes(merged.status) && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs rounded-lg"
                      onClick={() => {
                        setDraft((d) => ({ ...d, status: 'PENDING' as CourseStatus }));
                        toast.info('Nhấn "Lưu" để gửi duyệt.');
                      }}
                    >
                      🚀 Gửi duyệt
                    </Button>
                  )}
                  {merged.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs rounded-lg text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => {
                        setDraft((d) => ({ ...d, status: 'INACTIVE' as CourseStatus }));
                        toast.info('Nhấn "Lưu" để tạm ngưng.');
                      }}
                    >
                      ⏸️ Tạm ngưng
                    </Button>
                  )}
                </div>
                {merged.status === 'PENDING' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">⏳ Đang chờ admin duyệt.</p>
                )}
                {merged.status === 'REFUSE' && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">❌ Bị từ chối. Hãy sửa rồi gửi lại.</p>
                )}
                {draft.status && draft.status !== merged.status && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                    ⚡ Sẽ chuyển sang <strong>{draft.status === 'PENDING' ? 'Chờ duyệt' : 'Tạm ngưng'}</strong> khi bạn lưu.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mô tả</label>
              <Textarea
                className="rounded-xl"
                rows={5}
                value={draft.description ?? merged.description ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button className="rounded-xl px-6 shadow-sm" onClick={onSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Đang lưu...' : 'Lưu & cập nhật'}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={onClearDraft}>
                <RotateCcw className="w-4 h-4 mr-2" /> Xoá bản nháp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
