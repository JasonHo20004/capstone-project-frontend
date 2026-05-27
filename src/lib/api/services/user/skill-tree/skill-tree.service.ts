import apiClient from '@/lib/api/config';

// ─── Node & Tree Types ───────────────────────────────────────────────────────

export interface SkillTreeNode {
  id: string;
  status: 'active' | 'completed' | 'locked' | 'new';
  [key: string]: unknown;
}

/** Normalized, frontend-friendly shape for a saved skill tree. */
export interface SavedSkillTree {
  id: string;
  topic: string;
  level: string;
  nodes: SkillTreeNode[];
  updatedAt: string;
}

export interface SkillTreeProgress {
  completed: number;
  total: number;
  percentage: number;
}

// ─── Raw API shape ───────────────────────────────────────────────────────────

interface RawSkillTree {
  id: string;
  topic: string;
  level: string;
  nodes: unknown[];
  edges: unknown[];
  updatedAt: string;
  createdAt?: string;
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeTree(raw: RawSkillTree): SavedSkillTree {
  return {
    id: raw.id,
    topic: raw.topic,
    level: raw.level,
    nodes: (raw.nodes ?? []) as SkillTreeNode[],
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export function calculateProgress(nodes: SkillTreeNode[]): SkillTreeProgress {
  const total = nodes.length;
  const completed = nodes.filter((n) => n.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

// ─── API call ────────────────────────────────────────────────────────────────

export async function fetchUserTrees(userId: string): Promise<SavedSkillTree[]> {
  const response = await apiClient.get(`/ai/skill-tree/${userId}`);
  const raw: unknown[] = response.data?.data ?? [];
  return raw.map((item) => normalizeTree(item as RawSkillTree));
}

export async function patchGamification(data: {
  xp: number;
  streak: number;
  lastActiveDate: string;
}): Promise<void> {
  await apiClient.patch("/users/profile/gamification", data);
}
