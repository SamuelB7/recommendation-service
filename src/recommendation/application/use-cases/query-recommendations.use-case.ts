import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, RecommendationRepository } from '../../domain/ports/recommendation.repository';
import { RecommendationItem } from '../../domain/recommendation-types';

@Injectable()
export class QueryRecommendationsUseCase {
  constructor(@Inject(RECOMMENDATION_REPOSITORY) private readonly recommendationRepository: RecommendationRepository) {}

  forCustomer(customerId: string, limit: number): Promise<RecommendationItem[]> {
    return this.recommendationRepository.listForCustomer(customerId, limit);
  }

  related(listingId: string, limit: number): Promise<RecommendationItem[]> {
    return this.recommendationRepository.listRelated(listingId, limit);
  }

  popularByCategory(categoryId: string, limit: number): Promise<RecommendationItem[]> {
    return this.recommendationRepository.listPopularByCategory(categoryId, limit);
  }
}
