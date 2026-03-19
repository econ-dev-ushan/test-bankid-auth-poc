import { Injectable } from '@nestjs/common';
import type { BankIdLocalOrder } from '../types/bankid.types';

@Injectable()
export class BankIdOrderStoreService {
  private readonly orders = new Map<string, BankIdLocalOrder>();

  getCount() {
    return this.orders.size;
  }

  save(order: BankIdLocalOrder) {
    this.orders.set(order.orderId, order);
    return order;
  }

  get(orderId: string) {
    return this.orders.get(orderId) ?? null;
  }

  update(orderId: string, updates: Partial<BankIdLocalOrder>) {
    const existing = this.orders.get(orderId);

    if (!existing) {
      return null;
    }

    const nextOrder = {
      ...existing,
      ...updates,
    };

    this.orders.set(orderId, nextOrder);
    return nextOrder;
  }

  delete(orderId: string) {
    return this.orders.delete(orderId);
  }
}
