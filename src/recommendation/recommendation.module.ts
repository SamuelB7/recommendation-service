import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueryRecommendationsUseCase } from './application/use-cases/query-recommendations.use-case';
import { SyncRecommendationsUseCase } from './application/use-cases/sync-recommendations.use-case';
import { CassandraService } from './infrastructure/cassandra/cassandra.service';
import { recommendationRepositoryProvider } from './infrastructure/cassandra/cassandra-recommendation.repository';
import { RecommendationController } from './interfaces/http/recommendation.controller';
import { AccessTokenGuard } from './interfaces/http/guards/access-token.guard';
import { RolesGuard } from './interfaces/http/guards/roles.guard';
import { RecommendationEventsConsumer } from './interfaces/kafka/recommendation-events.consumer';

@Module({
  imports: [JwtModule.register({})],
  controllers: [RecommendationController, RecommendationEventsConsumer],
  providers: [
    CassandraService,
    recommendationRepositoryProvider,
    QueryRecommendationsUseCase,
    SyncRecommendationsUseCase,
    AccessTokenGuard,
    RolesGuard
  ]
})
export class RecommendationModule {}
