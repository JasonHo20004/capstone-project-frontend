/**
 * Domain - Transaction, Wallet, Order entities
 */

import type { OrderStatus, PaymentMethod, TransactionStatus, TransactionType } from './enums';

export interface Wallet {
  id: string;
  allowance: number;
  userId: string;
}

export interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  description?: string;
  walletId: string;
  transactionType: TransactionType;
  topupOrderId?: string;
  subscriptionContractId?: string;
  orderId?: string;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  cartId: string;
  transactionId?: string;
}

export interface TopupOrder {
  id: string;
  userId: string;
  realMoney: number;
  realAmount?: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  courseId: string;
  addedAt: string;
  priceAtTime: number;
  cartId: string;
}

export interface Cart {
  id: string;
  userId?: string;
  createdAt: string;
}
