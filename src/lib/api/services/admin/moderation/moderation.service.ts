import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";

export type CommentReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'SCAM'
  | 'MISINFORMATION'
  | 'OFF_TOPIC'
  | 'OTHER';

export type CommentReportStatus =
  | 'PENDING'
  | 'RESOLVED_REMOVED'
  | 'RESOLVED_KEPT'
  | 'DISMISSED';

export type CommentReportAction = 'remove' | 'keep' | 'dismiss';

export interface ModerationReport {
  id: string;
  commentId: string;
  reasonType: CommentReportReason;
  note: string | null;
  status: CommentReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reporter: { id: string; fullName: string };
  comment: {
    id: string;
    content: string;
    createdAt: string;
    hiddenAt: string | null;
    author: { id: string; fullName: string };
    lesson: {
      id: string;
      title: string;
      course: { id: string; title: string; courseSellerId: string };
    };
  };
}

export interface ModerationReportsResponse {
  data: ModerationReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ModerationSummary {
  pending: number;
  kept: number;
  removed: number;
  dismissed: number;
}

class ModerationService {
  async listReports(params?: {
    status?: CommentReportStatus;
    page?: number;
    limit?: number;
  }): Promise<ModerationReportsResponse> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    const response = await apiClient.get(`/admin/moderation/reports?${q.toString()}`);
    return response.data;
  }

  async getSummary(): Promise<ApiResponse<ModerationSummary>> {
    const response = await apiClient.get<ApiResponse<ModerationSummary>>(
      '/admin/moderation/reports/summary'
    );
    return response.data;
  }

  async resolve(
    reportId: string,
    payload: { action: CommentReportAction; note?: string }
  ): Promise<ApiResponse<unknown>> {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `/admin/moderation/reports/${reportId}/resolve`,
      payload
    );
    return response.data;
  }
}

export const moderationService = new ModerationService();
