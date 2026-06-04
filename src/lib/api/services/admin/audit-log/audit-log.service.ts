import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";

export const ADMIN_AUDIT_ACTIONS = [
  "WALLET_ADJUST",
  "USER_STATUS_CHANGE",
  "USER_DELETE",
  "APPLICATION_APPROVE",
  "APPLICATION_REJECT",
  "COURSE_APPROVE",
  "COURSE_REJECT",
  "COMMENT_MODERATE",
  "WITHDRAWAL_APPROVE",
  "WITHDRAWAL_REJECT",
  "REFUND_APPROVE",
  "REFUND_REJECT",
  "OTHER",
] as const;

export const ADMIN_AUDIT_ENTITIES = [
  "USER",
  "WALLET",
  "APPLICATION",
  "COURSE",
  "COMMENT",
  "WITHDRAWAL",
  "REFUND",
  "OTHER",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];
export type AdminAuditEntity = (typeof ADMIN_AUDIT_ENTITIES)[number];

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: AdminAuditAction;
  entityType: AdminAuditEntity;
  entityId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface CreateAuditLogPayload {
  action: AdminAuditAction;
  entityType: AdminAuditEntity;
  entityId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: AdminAuditAction;
  entityType?: AdminAuditEntity;
  entityId?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListAuditLogsResponse {
  success: boolean;
  data: AdminAuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class AuditLogService {
  async list(params?: ListAuditLogsParams): Promise<ListAuditLogsResponse> {
    const response = await apiClient.get<ListAuditLogsResponse>("/admin/audit-logs", {
      params,
    });
    return response.data;
  }

  /**
   * Record an admin action. Callers should call this AFTER their primary
   * mutation succeeds, and ignore failures (audit failure shouldn't roll back
   * the user-visible action).
   */
  async record(payload: CreateAuditLogPayload): Promise<ApiResponse<AdminAuditLog>> {
    const response = await apiClient.post<ApiResponse<AdminAuditLog>>(
      "/admin/audit-logs",
      payload,
    );
    return response.data;
  }
}

export const auditLogService = new AuditLogService();
