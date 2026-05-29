import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { SwipeService } from './swipe.service';

@ApiTags('swipe')
@Controller('swipe')
export class SwipeController {
  constructor(private swipeService: SwipeService) {}

  // GET /swipe/cards?page=1&limit=5&category=restaurant
  @Get('cards')
  @ApiOperation({
    summary: 'Get paginated place cards for swiping',
    description: 'Returns place data optimized for swipe interface with photos and basic info',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (1-indexed)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'Number of places per page',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'tourist_attraction',
    description: 'Filter by category (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated place cards',
    schema: {
      example: {
        data: [
          {
            id: 199,
            name: 'Waterbom Bali',
            rating: 4.7,
            totalRatings: 18191,
            priceLevel: 3,
            category: 'tourist_attraction',
            address: 'Jl. Raya Waterbom, Badung, Bali',
            description: 'Water park in Bali',
            photoUrl: 'https://maps.googleapis.com/maps/api/place/photo?...',
            coordinates: {
              lat: -8.7211,
              lng: 115.1691,
            },
          },
        ],
        meta: {
          total: 99,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  async getCards(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('category') category?: string,
  ) {
    return await this.swipeService.getCards(+page, +limit, category);
  }
}
