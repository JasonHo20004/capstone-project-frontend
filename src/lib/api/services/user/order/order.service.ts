import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Order } from '@/domain';
import type { PaginationMeta } from '@/lib/api/types';

export interface OrderHistoryResponse {
  data: Order[];
  pagination: PaginationMeta;
}

export interface PayOrderResponse {
  order: Order;
  transaction: {
    id: string;
    amount: number;
    status: string;
  };
}

class OrderService {
  /**
   * Create a new order from a cart
   * POST /orders
   */
  async createOrder(cartId: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', { cartId });
    return response.data;
  }

  /**
   * Pay for an order using wallet balance
   * POST /orders/:id/pay
   */
  async payOrder(orderId: string): Promise<ApiResponse<PayOrderResponse>> {
    const response = await apiClient.post<ApiResponse<PayOrderResponse>>(
      `/orders/${orderId}/pay`
    );
    return response.data;
  }

  /**
   * Get order history for current user
   * GET /orders/history
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<OrderHistoryResponse> {
    const response = await apiClient.get<OrderHistoryResponse>(
      '/orders/history',
      { params }
    );
    return response.data;
  }
}

export const orderService = new OrderService();
