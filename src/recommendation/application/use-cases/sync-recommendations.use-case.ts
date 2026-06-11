import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, RecommendationRepository } from '../../domain/ports/recommendation.repository';
import { ListingSnapshot, OrderItem } from '../../domain/recommendation-types';

type EventPayload = Record<string, unknown>;

@Injectable()
export class SyncRecommendationsUseCase {
  constructor(@Inject(RECOMMENDATION_REPOSITORY) private readonly recommendationRepository: RecommendationRepository) {}

  async listingPublished(payload: unknown): Promise<void> {
    const snapshot = this.toSnapshot(payload);
    if (!snapshot) return;

    await this.recommendationRepository.upsertListingSnapshot(snapshot);
    await this.recommendationRepository.addPopularByCategory({
      categoryId: snapshot.categoryId,
      item: {
        listingId: snapshot.listingId,
        title: snapshot.title,
        categoryId: snapshot.categoryId,
        score: 1,
        reason: 'new_listing',
        updatedAt: new Date()
      }
    });
  }

  async orderCreated(payload: unknown): Promise<void> {
    const value = this.object(payload);
    const customerId = this.string(value?.customerId ?? value?.authUserId);
    const items = this.orderItems(value?.items);

    if (!customerId || !items.length) return;

    await this.recommendationRepository.recordOrderCreated({ customerId, items });
  }

  async productViewed(payload: unknown): Promise<void> {
    const value = this.object(payload);
    const customerId = this.string(value?.customerId);
    const listingId = this.string(value?.listingId);

    if (!customerId || !listingId) return;

    await this.recommendationRepository.recordProductViewed({ customerId, listingId });
  }

  async behaviorAggregated(payload: unknown): Promise<void> {
    const value = this.object(payload);
    const listingId = this.string(value?.listingId);
    const score = this.number(value?.score);

    if (!listingId || score === undefined) return;

    await this.recommendationRepository.applyAnalyticsSignal({
      listingId,
      customerId: this.string(value?.customerId),
      categoryId: this.string(value?.categoryId),
      score,
      reason: this.string(value?.reason)
    });
  }

  private toSnapshot(payload: unknown): ListingSnapshot | null {
    const value = this.object(payload);
    const listingId = this.string(value?.listingId);
    const title = this.string(value?.title);
    const categoryId = this.string(value?.categoryId);

    if (!listingId || !title || !categoryId) {
      return null;
    }

    return {
      listingId,
      title,
      categoryId,
      sellerId: this.string(value?.sellerId)
    };
  }

  private orderItems(value: unknown): OrderItem[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => this.object(item))
      .filter((item): item is EventPayload => Boolean(item?.listingId))
      .map((item) => ({
        listingId: String(item.listingId),
        title: this.string(item.title),
        categoryId: this.string(item.categoryId)
      }));
  }

  private object(value: unknown): EventPayload | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as EventPayload) : null;
  }

  private string(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private number(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
