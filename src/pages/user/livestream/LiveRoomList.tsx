import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/api/use-user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AIAvatarAnime } from '@/components/user/livestream/AIAvatarAnime';
import { Users, Radio, Plus, LogIn, Clock, PlayCircle, BookOpen } from 'lucide-react';

// Lazy: this page ships in the main bundle, so the 3D avatar (three.js) must
// stay in its own chunk — same convention as PenguinHero3D.
const AIAvatar3D = lazy(() => import('@/components/user/livestream/AIAvatar3D'));

// Routes through the api-gateway (proxies /api/livestream/* to rag-service).
const RAG_BASE = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:3000';

interface Room {
  id: string;
  topic: string;
  lesson_prompt?: string;
  level: string;
  level_label: string;
  language: string;
  host_name: string;
  participant_count: number;
  status: 'waiting' | 'live' | 'completed';
  created_at: string;
}

interface Recording {
  room_id: string;
  topic: string;
  level: string;
  level_label: string;
  host_name: string;
  completed_at: string;
  section_count: number;
  qa_count: number;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced: 'bg-violet-100 text-violet-700 border-violet-200',
};

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-amber-100 text-amber-700',
  live: 'bg-red-100 text-red-600',
  completed: 'bg-slate-100 text-slate-500',
};

export default function LiveRoomList() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation('livestream');
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [lessonPrompt, setLessonPrompt] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [language, setLanguage] = useState('en');
  const [tab, setTab] = useState<'live' | 'recordings'>('live');
  const [createError, setCreateError] = useState('');

  const statusLabel = (status: string) => {
    if (status === 'waiting') return t('list.status.waiting');
    if (status === 'live') return t('list.status.live');
    if (status === 'completed') return t('list.status.completed');
    return status;
  };

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return t('list.timeAgo.seconds', { n: diff });
    if (diff < 3600) return t('list.timeAgo.minutes', { n: Math.floor(diff / 60) });
    return t('list.timeAgo.hours', { n: Math.floor(diff / 3600) });
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['livestream-rooms'],
    queryFn: async () => {
      const res = await fetch(`${RAG_BASE}/api/livestream/rooms`);
      return res.json() as Promise<{ rooms: Room[] }>;
    },
    refetchInterval: 8000,
  });

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['livestream-recordings'],
    queryFn: async () => {
      const res = await fetch(`${RAG_BASE}/api/livestream/recordings`);
      return res.json() as Promise<{ recordings: Recording[] }>;
    },
    enabled: tab === 'recordings',
    refetchInterval: 30000,
  });

  const createRoom = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken') ?? '';
      const res = await fetch(`${RAG_BASE}/api/livestream/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: topic.trim(),
          lesson_prompt: lessonPrompt.trim(),
          level,
          language,
          host_id: user?.id ?? 'guest',
          host_name: user?.fullName ?? 'Teacher',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { detail?: string; message?: string }).detail ||
          (data as { message?: string }).message ||
          t('list.dialog.submitError'),
        );
      }
      return res.json() as Promise<{ room_id: string }>;
    },
    onSuccess: ({ room_id }) => {
      setOpen(false);
      setTopic('');
      setLessonPrompt('');
      setCreateError('');
      navigate(`/live/${room_id}`);
    },
    onError: (e: Error) => setCreateError(e.message),
  });

  const rooms = data?.rooms ?? [];
  const recordings = recData?.recordings ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-900">{t('list.title')}</h1>
          </div>
          <p className="text-sm text-slate-500">
            {t('list.subtitle')}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" />
              {t('list.createRoom')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('list.dialog.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="topic">{t('list.dialog.topicLabel')}</Label>
                <Input
                  id="topic"
                  placeholder={t('list.dialog.topicPlaceholder')}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <p className="text-xs text-slate-400">{t('list.dialog.topicHint')}</p>
              </div>

              {/* Lesson prompt */}
              <div className="space-y-1.5">
                <Label htmlFor="lesson-prompt">
                  {t('list.dialog.lessonPromptLabel')}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">{t('list.dialog.lessonPromptOptional')}</span>
                </Label>
                <Textarea
                  id="lesson-prompt"
                  placeholder={t('list.dialog.lessonPromptPlaceholder')}
                  value={lessonPrompt}
                  onChange={(e) => setLessonPrompt(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-slate-400">{t('list.dialog.lessonPromptHint')}</p>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label>{t('list.dialog.levelLabel')}</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('list.dialog.level.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('list.dialog.level.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('list.dialog.level.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <Label>{t('list.dialog.languageLabel')}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('list.dialog.languageEn')}</SelectItem>
                    <SelectItem value="vi">{t('list.dialog.languageVi')}</SelectItem>
                  </SelectContent>
                </Select>
                {language === 'vi' && (
                  <p className="text-xs text-slate-400">
                    {t('list.dialog.languageViHint')}
                  </p>
                )}
              </div>

              {createError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {createError}
                </p>
              )}

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!topic.trim() || createRoom.isPending}
                onClick={() => createRoom.mutate()}
              >
                {createRoom.isPending ? <LoadingSpinner className="w-4 h-4" /> : t('list.dialog.submit')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('live')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'live'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Radio className="w-4 h-4" /> {t('list.tabs.live')}
        </button>
        <button
          onClick={() => setTab('recordings')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'recordings'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> {t('list.tabs.recordings')}
        </button>
      </div>

      {/* Room grid */}
      {tab === 'recordings' ? (
        recLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <BookOpen className="w-12 h-12 text-slate-300" />
            <div>
              <p className="font-medium text-slate-700">{t('list.recordings.empty')}</p>
              <p className="text-sm text-slate-400 mt-1">
                {t('list.recordings.emptyHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recordings.map((rec) => (
              <div
                key={rec.room_id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">
                    {rec.topic}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${LEVEL_COLORS[rec.level] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {rec.level_label}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {t('list.recordings.sections', { count: rec.section_count })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t('list.recordings.qas', { count: rec.qa_count })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(rec.completed_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    {t('list.recordings.hostLabel')} <span className="font-medium text-slate-700">{rec.host_name}</span>
                  </span>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                    onClick={() => navigate(`/live/replay/${rec.room_id}`)}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    {t('list.recordings.watchReplay')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <Suspense fallback={<AIAvatarAnime isSpeaking={false} className="w-28 h-28" name="" />}>
            <AIAvatar3D isSpeaking={false} className="w-28 h-28" name="" />
          </Suspense>
          <div>
            <p className="font-medium text-slate-700">{t('list.rooms.empty')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('list.rooms.emptyHint')}</p>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('list.rooms.createButton')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
                    {room.topic}
                  </h3>
                  {room.lesson_prompt && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{room.lesson_prompt}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[room.status]}`}>
                  {room.status === 'live' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                  )}
                  {statusLabel(room.status)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${LEVEL_COLORS[room.level] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {room.level_label}
                </Badge>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {room.language === 'vi' ? 'VI' : 'EN'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {t('list.rooms.joined', { count: room.participant_count })}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(room.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  {t('list.rooms.hostLabel')} <span className="font-medium text-slate-700">{room.host_name}</span>
                </span>
                <Button
                  size="sm"
                  variant={room.status === 'live' ? 'default' : 'outline'}
                  className={room.status === 'live' ? 'bg-indigo-600 hover:bg-indigo-700 gap-1.5' : 'gap-1.5'}
                  disabled={room.status === 'completed'}
                  onClick={() => navigate(`/live/${room.id}`)}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {room.status === 'completed' ? t('list.rooms.ended') : t('list.rooms.join')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t('list.refresh')}
        </button>
      </div>
    </div>
  );
}
