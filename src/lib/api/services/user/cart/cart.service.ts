// src/lib/api/services/cart.service.ts
import apiClient from '@/lib/api/config'
import type { ApiResponse } from  '@/lib/api/types'; // Assuming you have a generic ApiResponse type
import type { Cart } from '@/types/type';

export interface CheckoutResponse {
  id: string; // Order ID
  userId: string;
  cartId: string;
  totalAmount: number;
  transactionId: string;
  status: string;
  createdAt: string;
}
class CartService {
  // GET /cart
  public async getUserCart(): Promise<ApiResponse<Cart>> {
    const response = await apiClient.get<ApiResponse<Cart>>('/carts');
    return response.data;
  }

  // POST /cart/add-to-cart
  public async addToCart(courseId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/carts/add-to-cart', { courseId });
    return response.data;
  }

  // POST /cart/checkout/full-cart
  public async checkoutFullCart(): Promise<ApiResponse<CheckoutResponse>> {
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/carts/checkout/full-cart');
    return response.data;
  }

  // POST /cart/checkout/partial
  public async checkoutPartial(cartItemIds: string[]): Promise<ApiResponse<CheckoutResponse>> {
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/carts/checkout/partial', {
      cartItemIds,
    });
    return response.data;
  }
  
  // POST /cart/checkout/direct-buy (If you need it later)
  public async directBuy(courseId: string): Promise<ApiResponse<CheckoutResponse>> {
      const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/carts/checkout/direct-buy', {
          courseId
      });
      return response.data;
  }
}

export const cartService = new CartService();