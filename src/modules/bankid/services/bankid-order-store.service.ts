import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BankIdLocalOrder } from '../types/bankid.types';

@Injectable()
export class BankIdOrderStoreService {
  private readonly logger = new Logger(BankIdOrderStoreService.name);
  private readonly orders = new Map<string, BankIdLocalOrder>();

  constructor(private readonly configService: ConfigService) {}

  getCount() {
    this.pruneExpiredOrders();
    return this.orders.size;
  }

  save(order: BankIdLocalOrder) {
    this.pruneExpiredOrders();
    this.orders.set(order.orderId, order);
    return order;
  }

  get(orderId: string) {
    this.pruneExpiredOrders();
    return this.orders.get(orderId) ?? null;
  }

  update(orderId: string, updates: Partial<BankIdLocalOrder>) {
    this.pruneExpiredOrders();
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

  pruneExpiredOrders(now = new Date()) {
    const expiredOrderIds = [...this.orders.values()]
      .filter((order) => this.isExpired(order, now))
      .map((order) => order.orderId);

    for (const orderId of expiredOrderIds) {
      this.orders.delete(orderId);
    }

    if (expiredOrderIds.length > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'order_store_pruned',
          expiredOrderCount: expiredOrderIds.length,
          ttlSeconds: this.getOrderTtlSeconds(),
          activeOrders: this.orders.size,
        }),
      );
    }

    return expiredOrderIds.length;
  }

  private isExpired(order: BankIdLocalOrder, now: Date) {
    const referenceTimestamp = this.getRetentionReferenceTimestamp(order);
    return now.getTime() - referenceTimestamp.getTime() >= this.getOrderTtlMs();
  }

  private getRetentionReferenceTimestamp(order: BankIdLocalOrder) {
    const retentionAnchor =
      order.completedAt ?? order.cancelledAt ?? order.failedAt ?? order.startedAt;

    return new Date(retentionAnchor);
  }

  private getOrderTtlMs() {
    return this.getOrderTtlSeconds() * 1000;
  }

  private getOrderTtlSeconds() {
    return this.configService.get<number>('BANKID_ORDER_TTL_SECONDS', 300);
  }
}
