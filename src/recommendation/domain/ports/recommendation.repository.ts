import { ListingSnapshot, OrderItem, RecommendationItem } from '../recommendation-types';

export const RECOMMENDATION_REPOSITORY = Symbol('RECOMMENDATION_REPOSITORY');

export interface RecommendationRepository {
  upsertListingSnapshot(snapshot: ListingSnapshot): Promise<void>;
  addPopularByCategory(input: { categoryId: string; item: RecommendationItem }): Promise<void>;
  addRecommendationForCustomer(input: { customerId: string; item: RecommendationItem }): Promise<void>;
  addRelatedProduct(input: { listingId: string; item: RecommendationItem }): Promise<void>;
  recordProductViewed(input: { customerId: string; listingId: string }): Promise<void>;
  recordOrderCreated(input: { customerId: string; items: OrderItem[] }): Promise<void>;
  applyAnalyticsSignal(input: { customerId?: string; listingId: string; categoryId?: string; score: number; reason?: string }): Promise<void>;
  listForCustomer(customerId: string, limit: number): Promise<RecommendationItem[]>;
  listRelated(listingId: string, limit: number): Promise<RecommendationItem[]>;
  listPopularByCategory(categoryId: string, limit: number): Promise<RecommendationItem[]>;
}
