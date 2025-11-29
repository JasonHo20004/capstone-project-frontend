import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Wallet } from '@/types/type'; // Giả sử bạn đã có type Wallet

export interface CreateTopupRequest {
  realMoney: number;
}

export interface CreateTopupResponse {
  orderId: string;
  payUrl: string; // Link để redirect sang MoMo
}

export type ConfirmPaymentRequest = Record<string, any>;
class TopupService {
  /**
   * Bước 1: Tạo yêu cầu nạp tiền
   * POST /topup-orders/create
   */
  async createOrder(data: CreateTopupRequest): Promise<ApiResponse<CreateTopupResponse>> {
    // Sửa generic type từ string -> CreateTopupResponse
    const response = await apiClient.post<ApiResponse<CreateTopupResponse>>(
      '/topup-orders/create',
      data
    );
    return response.data;
  }

  /**
   * Bước 2: Xác nhận thanh toán thành công
   * POST /topup-orders/confirm-payment
   */
  async confirmPayment(data: ConfirmPaymentRequest): Promise<ApiResponse<Wallet>> {
    const response = await apiClient.post<ApiResponse<Wallet>>(
      '/topup-orders/confirm-payment',
      data
    );
    return response.data;
  }
}

export const topupService = new TopupService();