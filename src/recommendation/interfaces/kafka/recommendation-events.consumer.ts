import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { SyncRecommendationsUseCase } from '../../application/use-cases/sync-recommendations.use-case';

@Controller()
export class RecommendationEventsConsumer {
  constructor(private readonly syncRecommendationsUseCase: SyncRecommendationsUseCase) {}

  @EventPattern('catalog.listing.published.v1')
  async handleListingPublished(@Payload() payload: unknown, @Ctx() context: KafkaContext): Promise<void> {
    await this.syncRecommendationsUseCase.listingPublished(payload);
    this.logConsumed(context, payload);
  }

  @EventPattern('orders.order.created.v1')
  async handleOrderCreated(@Payload() payload: unknown, @Ctx() context: KafkaContext): Promise<void> {
    await this.syncRecommendationsUseCase.orderCreated(payload);
    this.logConsumed(context, payload);
  }

  @EventPattern('search.product_viewed.v1')
  async handleProductViewed(@Payload() payload: unknown, @Ctx() context: KafkaContext): Promise<void> {
    await this.syncRecommendationsUseCase.productViewed(payload);
    this.logConsumed(context, payload);
  }

  @EventPattern('analytics.behavior_aggregated.v1')
  async handleBehaviorAggregated(@Payload() payload: unknown, @Ctx() context: KafkaContext): Promise<void> {
    await this.syncRecommendationsUseCase.behaviorAggregated(payload);
    this.logConsumed(context, payload);
  }

  private logConsumed(context: KafkaContext, payload: unknown): void {
    console.log('[recommendation-service] consumed integration event', {
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      payload
    });
  }
}
