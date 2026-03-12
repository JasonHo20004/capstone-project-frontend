import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CreateTopupRequest {
  realMoney: number;
}

export interface CreateTopupResponse {
  orderId: string;
  paymentIntentId: string;
  clientSecret: string | null;
  publishableKey?: string;
  amount: number;
  currency: string;
}

export interface TopupOrderStatus {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentMethod: 'STRIPE' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';
  amount: number;
  clientSecret: string | null;
  paymentIntentId: string | null;
}

class TopupService {
  async createOrder(data: CreateTopupRequest): Promise<ApiResponse<CreateTopupResponse>> {
    const response = await apiClient.post<ApiResponse<CreateTopupResponse>>('/topup-orders/create', data);
    return response.data;
  }

  async getOrderStatus(orderId: string): Promise<ApiResponse<TopupOrderStatus>> {
    const response = await apiClient.get<ApiResponse<TopupOrderStatus>>(`/topup-orders/${orderId}`);
    return response.data;
  }
}

export const topupService = new TopupService();