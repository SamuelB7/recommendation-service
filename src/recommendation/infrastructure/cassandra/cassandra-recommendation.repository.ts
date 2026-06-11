import { Injectable } from '@nestjs/common';
import { RecommendationRepository, RECOMMENDATION_REPOSITORY } from '../../domain/ports/recommendation.repository';
import { ListingSnapshot, OrderItem, RecommendationItem } from '../../domain/recommendation-types';
import { CassandraService } from './cassandra.service';

type CassandraRow = {
  get(name: string): any;
};

@Injectable()
export class CassandraRecommendationRepository implements RecommendationRepository {
  constructor(private readonly cassandra: CassandraService) {}

  async upsertListingSnapshot(snapshot: ListingSnapshot): Promise<void> {
    await this.cassandra.execute(
      `INSERT INTO ${this.cassandra.table('listing_snapshots')} (listing_id, title, category_id, seller_id, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [snapshot.listingId, snapshot.title, snapshot.categoryId, snapshot.sellerId, new Date()]
    );
  }

  async addPopularByCategory(input: { categoryId: string; item: RecommendationItem }): Promise<void> {
    await this.cassandra.execute(
      `INSERT INTO ${this.cassandra.table('popular_products_by_category')} (category_id, score, listing_id, title, reason, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.categoryId, input.item.score, input.item.listingId, input.item.title, input.item.reason, input.item.updatedAt]
    );
  }

  async addRecommendationForCustomer(input: { customerId: string; item: RecommendationItem }): Promise<void> {
    await this.cassandra.execute(
      `INSERT INTO ${this.cassandra.table('recommendations_by_customer')} (customer_id, score, listing_id, title, category_id, reason, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.customerId,
        input.item.score,
        input.item.listingId,
        input.item.title,
        input.item.categoryId,
        input.item.reason,
        input.item.updatedAt
      ]
    );
  }

  async addRelatedProduct(input: { listingId: string; item: RecommendationItem }): Promise<void> {
    await this.cassandra.execute(
      `INSERT INTO ${this.cassandra.table('related_products_by_listing')} (listing_id, score, related_listing_id, title, category_id, reason, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.listingId,
        input.item.score,
        input.item.listingId,
        input.item.title,
        input.item.categoryId,
        input.item.reason,
        input.item.updatedAt
      ]
    );
  }

  async recordProductViewed(input: { customerId: string; listingId: string }): Promise<void> {
    const snapshot = await this.findSnapshot(input.listingId);
    await this.addRecommendationForCustomer({
      customerId: input.customerId,
      item: this.itemFromSnapshot(snapshot, input.listingId, 10, 'recently_viewed')
    });
  }

  async recordOrderCreated(input: { customerId: string; items: OrderItem[] }): Promise<void> {
    for (const item of input.items) {
      const snapshot = await this.ensureSnapshotFromItem(item);
      await this.addRecommendationForCustomer({
        customerId: input.customerId,
        item: this.itemFromSnapshot(snapshot, item.listingId, 25, 'purchased_item')
      });
    }

    for (const source of input.items) {
      for (const target of input.items) {
        if (source.listingId === target.listingId) continue;
        const snapshot = await this.ensureSnapshotFromItem(target);
        await this.addRelatedProduct({
          listingId: source.listingId,
          item: this.itemFromSnapshot(snapshot, target.listingId, 30, 'frequently_bought_together')
        });
      }
    }
  }

  async applyAnalyticsSignal(input: { customerId?: string; listingId: string; categoryId?: string; score: number; reason?: string }): Promise<void> {
    const snapshot = await this.findSnapshot(input.listingId);
    const item = this.itemFromSnapshot(snapshot, input.listingId, input.score, input.reason ?? 'behavior_signal');

    if (input.customerId) {
      await this.addRecommendationForCustomer({ customerId: input.customerId, item });
    }

    const categoryId = input.categoryId ?? item.categoryId;
    if (categoryId) {
      await this.addPopularByCategory({ categoryId, item });
    }
  }

  async listForCustomer(customerId: string, limit: number): Promise<RecommendationItem[]> {
    const result = await this.cassandra.execute(
      `SELECT listing_id, title, category_id, score, reason, updated_at
       FROM ${this.cassandra.table('recommendations_by_customer')}
       WHERE customer_id = ?
       LIMIT ${this.limit(limit)}`,
      [customerId]
    );

    return result.rows.map((row) => this.mapItem(row, 'listing_id'));
  }

  async listRelated(listingId: string, limit: number): Promise<RecommendationItem[]> {
    const result = await this.cassandra.execute(
      `SELECT related_listing_id, title, category_id, score, reason, updated_at
       FROM ${this.cassandra.table('related_products_by_listing')}
       WHERE listing_id = ?
       LIMIT ${this.limit(limit)}`,
      [listingId]
    );

    return result.rows.map((row) => this.mapItem(row, 'related_listing_id'));
  }

  async listPopularByCategory(categoryId: string, limit: number): Promise<RecommendationItem[]> {
    const result = await this.cassandra.execute(
      `SELECT listing_id, title, score, reason, updated_at
       FROM ${this.cassandra.table('popular_products_by_category')}
       WHERE category_id = ?
       LIMIT ${this.limit(limit)}`,
      [categoryId]
    );

    return result.rows.map((row) => ({
      ...this.mapItem(row, 'listing_id'),
      categoryId
    }));
  }

  private async ensureSnapshotFromItem(item: OrderItem): Promise<ListingSnapshot | null> {
    if (item.title && item.categoryId) {
      const snapshot = { listingId: item.listingId, title: item.title, categoryId: item.categoryId };
      await this.upsertListingSnapshot(snapshot);
      return snapshot;
    }

    return this.findSnapshot(item.listingId);
  }

  private async findSnapshot(listingId: string): Promise<ListingSnapshot | null> {
    const result = await this.cassandra.execute(
      `SELECT listing_id, title, category_id, seller_id
       FROM ${this.cassandra.table('listing_snapshots')}
       WHERE listing_id = ?`,
      [listingId]
    );

    const row = result.first();
    if (!row) return null;

    return {
      listingId: row.get('listing_id'),
      title: row.get('title'),
      categoryId: row.get('category_id'),
      sellerId: row.get('seller_id')
    };
  }

  private itemFromSnapshot(snapshot: ListingSnapshot | null, listingId: string, score: number, reason: string): RecommendationItem {
    return {
      listingId,
      title: snapshot?.title,
      categoryId: snapshot?.categoryId,
      score,
      reason,
      updatedAt: new Date()
    };
  }

  private mapItem(row: CassandraRow, idColumn: string): RecommendationItem {
    return {
      listingId: row.get(idColumn),
      title: row.get('title') ?? undefined,
      categoryId: row.get('category_id') ?? undefined,
      score: row.get('score'),
      reason: row.get('reason'),
      updatedAt: row.get('updated_at')
    };
  }

  private limit(limit: number): number {
    return Math.min(Math.max(limit, 1), 100);
  }
}

export const recommendationRepositoryProvider = {
  provide: RECOMMENDATION_REPOSITORY,
  useClass: CassandraRecommendationRepository
};
