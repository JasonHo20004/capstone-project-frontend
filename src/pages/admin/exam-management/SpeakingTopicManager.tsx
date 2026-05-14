import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiEvaluationService } from '@/lib/api/services/user/ai-evaluation/ai-evaluation.service';
import { Link } from 'react-router-dom';

interface SpeakingTopic {
  id: string;
  title: string;
  isActive: boolean;
  isPremium: boolean;
  part1Questions: string[];
  part2Topic: string | null;
  part2Bullets: string[];
  part2FinalPrompt: string | null;
  part3Questions: string[];
  _count?: { sessions: number };
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  part1Questions: ['', '', '', ''],
  part2Topic: '',
  part2Bullets: ['', '', '', ''],
  part2FinalPrompt: '',
  part3Questions: ['', '', '', ''],
};

export default function SpeakingTopicManager() {
  const queryClient = useQueryClient();
  const [editingTopic, setEditingTopic] = useState<SpeakingTopic | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenError, setAutoGenError] = useState<string | null>(null);
  const [previewTopic, setPreviewTopic] = useState<SpeakingTopic | null>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: topicsRes, isLoading } = useQuery({
    queryKey: ['speaking-topics'],
    queryFn: () => aiEvaluationService.listSpeakingTopics(),
  });
  const topics: SpeakingTopic[] = (topicsRes?.data as any) || [];

  // ─── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => aiEvaluationService.createSpeakingTopic({
      ...data,
      part1Questions: data.part1Questions.filter(q => q.trim()),
      part2Bullets: data.part2Bullets.filter(b => b.trim()),
      part3Questions: data.part3Questions.filter(q => q.trim()),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaking-topics'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => aiEvaluationService.updateSpeakingTopic(id, {
      ...data,
      part1Questions: data.part1Questions.filter((q: string) => q.trim()),
      part2Bullets: data.part2Bullets.filter((b: string) => b.trim()),
      part3Questions: data.part3Questions.filter((q: string) => q.trim()),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaking-topics'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiEvaluationService.deleteSpeakingTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['speaking-topics'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      aiEvaluationService.updateSpeakingTopic(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['speaking-topics'] }),
  });

  const togglePremiumMutation = useMutation({
    mutationFn: (id: string) =>
      aiEvaluationService.toggleSpeakingTopicPremium(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['speaking-topics'] }),
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingTopic(null);
    setShowForm(false);
    setAutoGenError(null);
  };

  const handleAutoGenerate = async () => {
    const title = form.title.trim();
    if (!title) {
      setAutoGenError("Vui lòng nhập Topic Title trước khi tạo bằng AI.");
      return;
    }
    setAutoGenLoading(true);
    setAutoGenError(null);
    try {
      const r = await aiEvaluationService.autoGenerateSpeakingTopic(title);
      const d: any = r.data;
      if (!d) throw new Error("Empty AI response");
      setForm({
        title,
        part1Questions: Array.isArray(d.part1Questions) && d.part1Questions.length > 0
          ? d.part1Questions
          : form.part1Questions,
        part2Topic: d.part2Topic || form.part2Topic,
        part2Bullets: Array.isArray(d.part2Bullets) && d.part2Bullets.length > 0
          ? d.part2Bullets
          : form.part2Bullets,
        part2FinalPrompt: d.part2FinalPrompt || form.part2FinalPrompt,
        part3Questions: Array.isArray(d.part3Questions) && d.part3Questions.length > 0
          ? d.part3Questions
          : form.part3Questions,
      });
    } catch (err: any) {
      setAutoGenError(err?.response?.data?.error || err?.message || "AI generation failed");
    } finally {
      setAutoGenLoading(false);
    }
  };

  const startEditing = (topic: SpeakingTopic) => {
    setEditingTopic(topic);
    setForm({
      title: topic.title,
      part1Questions: [...(topic.part1Questions || []), '', '', '', ''].slice(0, Math.max(4, topic.part1Questions?.length || 0)),
      part2Topic: topic.part2Topic || '',
      part2Bullets: [...(topic.part2Bullets || []), '', '', '', ''].slice(0, Math.max(4, topic.part2Bullets?.length || 0)),
      part2FinalPrompt: topic.part2FinalPrompt || '',
      part3Questions: [...(topic.part3Questions || []), '', '', '', ''].slice(0, Math.max(4, topic.part3Questions?.length || 0)),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateArrayField = (field: 'part1Questions' | 'part2Bullets' | 'part3Questions', index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayField = (field: 'part1Questions' | 'part2Bullets' | 'part3Questions') => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayField = (field: 'part1Questions' | 'part2Bullets' | 'part3Questions', index: number) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 mb-1 inline-block">← Admin Dashboard</Link>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">mic</span>
              Speaking Question Bank
            </h1>
            <p className="text-sm text-slate-500 mt-1">{topics.length} topics · Admin-managed questions for IELTS Speaking</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm Topic
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-black text-slate-800 mb-4">
              {editingTopic ? `Sửa: ${editingTopic.title}` : 'Thêm Topic Mới'}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Topic Title</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Hometown and Living"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={autoGenLoading || !form.title.trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                  title="AI tự sinh full nội dung 3 Parts từ Title"
                >
                  {autoGenLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      AI đang viết...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Tạo bằng AI
                    </>
                  )}
                </button>
              </div>
              {autoGenError && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">error</span>
                  {autoGenError}
                </p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                💡 Mẹo: Gõ chủ đề (vd "Social Media in Vietnam") rồi nhấn <b>Tạo bằng AI</b> — Gemini sẽ tự soạn full 5 câu Part 1, cue card Part 2, và 6 câu Part 3 sau ~10s. Bạn review + sửa rồi mới lưu.
              </p>
            </div>

            {/* Part 1 Questions */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                Part 1 — Introduction Questions
              </label>
              {form.part1Questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-400 w-5">{i + 1}.</span>
                  <input
                    type="text"
                    value={q}
                    onChange={e => updateArrayField('part1Questions', i, e.target.value)}
                    placeholder={`Part 1 question ${i + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {form.part1Questions.length > 1 && (
                    <button onClick={() => removeArrayField('part1Questions', i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArrayField('part1Questions')} className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer mt-1">+ Thêm câu hỏi</button>
            </div>

            {/* Part 2 Cue Card */}
            <div className="mb-6 bg-amber-50/50 rounded-xl p-4 border border-amber-200/50">
              <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                Part 2 — Cue Card
              </label>
              <input
                type="text"
                value={form.part2Topic}
                onChange={e => setForm(prev => ({ ...prev, part2Topic: e.target.value }))}
                placeholder="Describe a place you visited recently"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5">Bullet Points:</p>
              {form.part2Bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-amber-500">•</span>
                  <input
                    type="text"
                    value={b}
                    onChange={e => updateArrayField('part2Bullets', i, e.target.value)}
                    placeholder={`Bullet point ${i + 1}`}
                    className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {form.part2Bullets.length > 1 && (
                    <button onClick={() => removeArrayField('part2Bullets', i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArrayField('part2Bullets')} className="text-xs text-amber-600 font-bold hover:underline cursor-pointer mt-1">+ Thêm bullet</button>
              <input
                type="text"
                value={form.part2FinalPrompt}
                onChange={e => setForm(prev => ({ ...prev, part2FinalPrompt: e.target.value }))}
                placeholder="Final prompt: Explain why it was memorable"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Part 3 Questions */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                Part 3 — Discussion Questions
              </label>
              {form.part3Questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-400 w-5">{i + 1}.</span>
                  <input
                    type="text"
                    value={q}
                    onChange={e => updateArrayField('part3Questions', i, e.target.value)}
                    placeholder={`Part 3 question ${i + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  {form.part3Questions.length > 1 && (
                    <button onClick={() => removeArrayField('part3Questions', i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArrayField('part3Questions')} className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer mt-1">+ Thêm câu hỏi</button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : editingTopic ? 'Cập nhật' : 'Tạo Topic'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewTopic({
                  id: editingTopic?.id || 'preview',
                  title: form.title || '(Untitled)',
                  isActive: editingTopic?.isActive ?? true,
                  isPremium: editingTopic?.isPremium ?? false,
                  part1Questions: form.part1Questions.filter(q => q.trim()),
                  part2Topic: form.part2Topic || null,
                  part2Bullets: form.part2Bullets.filter(b => b.trim()),
                  part2FinalPrompt: form.part2FinalPrompt || null,
                  part3Questions: form.part3Questions.filter(q => q.trim()),
                  createdAt: editingTopic?.createdAt || new Date().toISOString(),
                })}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-bold transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Xem trước
              </button>
              <button onClick={resetForm} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-bold cursor-pointer">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Topic List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3 block">mic_off</span>
            <p className="text-slate-500 font-medium">Chưa có topic nào</p>
            <p className="text-sm text-slate-400 mt-1">Nhấn "Thêm Topic" để tạo question bank đầu tiên</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map(topic => (
              <div key={topic.id} className={`bg-white rounded-2xl border ${topic.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/30'} shadow-sm p-5 transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-black text-slate-800">{topic.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        topic.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {topic.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {topic.isPremium && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">diamond</span>
                          PRO
                        </span>
                      )}
                      {topic._count && (
                        <span className="text-[10px] text-slate-400">{topic._count.sessions} sessions</span>
                      )}
                    </div>

                    {/* Part summary */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        Part 1: {(topic.part1Questions || []).filter(Boolean).length} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Part 2: {topic.part2Topic ? '✓ Cue card' : '✗ No cue card'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Part 3: {(topic.part3Questions || []).filter(Boolean).length} questions
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => setPreviewTopic(topic)}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="Xem trước (user POV)"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button
                      onClick={() => togglePremiumMutation.mutate(topic.id)}
                      className={`p-2 rounded-lg transition cursor-pointer ${
                        topic.isPremium
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                      }`}
                      title={topic.isPremium ? 'Bỏ PRO' : 'Đặt PRO'}
                    >
                      <span className="material-symbols-outlined text-[18px]">diamond</span>
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: topic.id, isActive: !topic.isActive })}
                      className={`p-2 rounded-lg ${topic.isActive ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600'} transition cursor-pointer`}
                      title={topic.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span className="material-symbols-outlined text-[18px]">{topic.isActive ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    <button
                      onClick={() => startEditing(topic)}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => { if (confirm('Xóa topic này?')) deleteMutation.mutate(topic.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal — show topic the way the user sees it */}
      {previewTopic && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewTopic(null)}
        >
          <div
            className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined">visibility</span>
                <div className="min-w-0">
                  <p className="font-black text-base truncate">Preview · User POV</p>
                  <p className="text-[11px] opacity-90 truncate">{previewTopic.title}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTopic(null)}
                className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Preview Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Part 1 */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
                  <h3 className="font-black text-slate-800">Part 1 — Introduction & Interview</h3>
                  <span className="text-[10px] font-bold text-slate-400 ml-auto">~4-5 phút</span>
                </div>
                {previewTopic.part1Questions.length === 0 ? (
                  <p className="text-xs italic text-slate-400 bg-slate-100 rounded-xl p-4">Chưa có câu hỏi Part 1 — AI sẽ tự sinh khi user thi.</p>
                ) : (
                  <ol className="space-y-2">
                    {previewTopic.part1Questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3">
                        <span className="text-xs font-mono font-black text-indigo-500 shrink-0 mt-0.5">Q{i + 1}.</span>
                        <p className="text-sm text-slate-700 italic">"{q}"</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {/* Part 2 Cue Card */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
                  <h3 className="font-black text-slate-800">Part 2 — Cue Card (Long Turn)</h3>
                  <span className="text-[10px] font-bold text-slate-400 ml-auto">1' prep + 1-2' speak</span>
                </div>
                {!previewTopic.part2Topic ? (
                  <p className="text-xs italic text-slate-400 bg-slate-100 rounded-xl p-4">Chưa có cue card Part 2 — AI sẽ tự sinh khi user thi.</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="p-5">
                      <h4 className="text-xl font-black text-slate-800 mb-4">{previewTopic.part2Topic}</h4>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3">You should say:</p>
                        <ul className="space-y-2.5">
                          {previewTopic.part2Bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">{i + 1}</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        {previewTopic.part2FinalPrompt && (
                          <p className="mt-4 pt-3 border-t border-amber-100 text-sm text-slate-800 font-bold flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">forum</span>
                            {previewTopic.part2FinalPrompt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Part 3 */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
                  <h3 className="font-black text-slate-800">Part 3 — Two-way Discussion</h3>
                  <span className="text-[10px] font-bold text-slate-400 ml-auto">~4-5 phút</span>
                </div>
                {previewTopic.part3Questions.length === 0 ? (
                  <p className="text-xs italic text-slate-400 bg-slate-100 rounded-xl p-4">Chưa có câu hỏi Part 3 — AI sẽ tự sinh khi user thi.</p>
                ) : (
                  <ol className="space-y-2">
                    {previewTopic.part3Questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3">
                        <span className="text-xs font-mono font-black text-emerald-600 shrink-0 mt-0.5">Q{i + 1}.</span>
                        <p className="text-sm text-slate-700 italic">"{q}"</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {/* Sanity checks */}
              {(() => {
                const issues: string[] = [];
                if (previewTopic.part1Questions.length < 3) issues.push("Part 1 nên có ít nhất 3-5 câu hỏi");
                if (!previewTopic.part2Topic) issues.push("Part 2 chưa có cue card topic");
                if (previewTopic.part2Bullets.length < 3) issues.push("Cue card nên có ≥3 bullet points");
                if (previewTopic.part3Questions.length < 3) issues.push("Part 3 nên có ít nhất 3-6 câu hỏi");
                if (issues.length === 0) return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-black text-emerald-800">Topic sẵn sàng publish</p>
                      <p className="text-xs text-emerald-700">Đủ nội dung cho cả 3 Parts. User có thể thi đầy đủ format IELTS.</p>
                    </div>
                  </div>
                );
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-black text-amber-800 flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined">warning</span>
                      Cảnh báo
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1 pl-6 list-disc">
                      {issues.map((i, k) => <li key={k}>{i}</li>)}
                    </ul>
                    <p className="text-[10px] text-amber-600 mt-2">Vẫn có thể publish — AI sẽ tự fallback sinh câu hỏi thiếu khi user thi.</p>
                  </div>
                );
              })()}
            </div>

            {/* Preview Footer */}
            <div className="border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">Đây là cách user sẽ thấy topic trong bài thi.</p>
              <button
                onClick={() => setPreviewTopic(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
