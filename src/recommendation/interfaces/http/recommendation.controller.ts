import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryRecommendationsUseCase } from '../../application/use-cases/query-recommendations.use-case';
import { AuthenticatedRequest } from './authenticated-request';
import { RecommendationQueryDto } from './dtos/recommendation.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RequireRoles } from './guards/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('recommendations')
@Controller()
export class RecommendationController {
  constructor(private readonly queryRecommendationsUseCase: QueryRecommendationsUseCase) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return personalized recommendations for current customer' })
  @UseGuards(AccessTokenGuard)
  @Get('recommendations/me')
  recommendationsForMe(@Req() request: AuthenticatedRequest, @Query() query: RecommendationQueryDto) {
    return this.queryRecommendationsUseCase.forCustomer(request.user.id, query.limit ?? 20);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return personalized recommendations for a customer' })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @Get('recommendations/customers/:customerId')
  recommendationsForCustomer(@Param('customerId') customerId: string, @Query() query: RecommendationQueryDto) {
    return this.queryRecommendationsUseCase.forCustomer(customerId, query.limit ?? 20);
  }

  @ApiOperation({ summary: 'Return related products for a listing' })
  @Get('recommendations/listings/:listingId/related')
  relatedProducts(@Param('listingId') listingId: string, @Query() query: RecommendationQueryDto) {
    return this.queryRecommendationsUseCase.related(listingId, query.limit ?? 20);
  }

  @ApiOperation({ summary: 'Return popular products by category' })
  @Get('recommendations/categories/:categoryId/popular')
  popularByCategory(@Param('categoryId') categoryId: string, @Query() query: RecommendationQueryDto) {
    return this.queryRecommendationsUseCase.popularByCategory(categoryId, query.limit ?? 20);
  }
}
