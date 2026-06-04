import { Controller, Get, Query, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { SwipeService } from './swipe.service';

@ApiTags('swipe')
@Controller('swipe')
export class SwipeController {
  constructor(private swipeService: SwipeService) {}

  /**
   * SWIPE API - Travel Place Discovery
   *
   * The Swipe API provides endpoints for discovering and filtering travel places in Bali.
   * All places include ratings, pricing, location coordinates, photos, and tags.
   *
   * Workflow:
   * 1. Call /swipe/tags to get available tags with their IDs for filtering
   * 2. Call /swipe/regencies to get available regencies (districts/cities) with their IDs
   * 3. Call /swipe/budgets to get available budget tiers
   * 4. Call /swipe/cards with filters to get places matching your criteria
   *
   * Location & Distance:
   * - Proximity search: /swipe/cards?lat=-8.5069&lng=115.2625&radius=5000
   *   Returns places within 5km, sorted by distance (nearest first), with distance in meters
   *
   * Filter Combinations:
   * - By category: /swipe/cards?category=tourist_attraction
   * - By regencyId: /swipe/cards?regencyId=8 (Kota Denpasar)
   * - By tagIds: /swipe/cards?tagIds=1,9 (returns places with ANY of these tags)
   * - By budget: /swipe/cards?budgetId=2 (Mid-Range: 75k-200k IDR)
   * - By location: /swipe/cards?lat=-8.5069&lng=115.2625&radius=5000
   * - Combined: /swipe/cards?regencyId=8&tagIds=1&budgetId=2
   * - Distance + budget: /swipe/cards?lat=-8.5069&lng=115.2625&radius=5000&budgetId=1
   */

  @Get('cards')
  @ApiOperation({
    summary: 'Get paginated place cards sorted by distance and drive time from your location',
    description: `Returns places near your current location with distance and estimated drive time.

REQUIRED Parameters:
- lat: Your current latitude (e.g., -8.5069)
- lng: Your current longitude (e.g., 115.2625)

OPTIONAL Query Filters:
- page: Pagination (default: 1)
- limit: Results per page (default: 5)
- radius: Search radius in meters (default: 10000 = 10km)
- category: Place type (e.g., tourist_attraction, restaurant, museum)
- regencyId: Bali regency ID (numeric) - use /swipe/regencies to get IDs
- tagIds: Comma-separated tag IDs (returns places with ANY tag) - use /swipe/tags to get IDs
- budgetId: Budget tier (1=Budget/0-75k, 2=Mid-Range/75k-200k, 3=Premium/200k-500k)

Response Includes:
- distance: Distance in meters from your location
- driveTimeMinutes: Estimated driving time from your location (based on 50km/h average speed)

All results sorted by distance (nearest first).

Examples:
- /swipe/cards?lat=-8.5069&lng=115.2625 - All places near you, sorted by distance
- /swipe/cards?lat=-8.5069&lng=115.2625&radius=5000 - Places within 5km
- /swipe/cards?lat=-8.5069&lng=115.2625&tagIds=9 - Nature spots near you
- /swipe/cards?lat=-8.5069&lng=115.2625&budgetId=2 - Mid-range places near you
- /swipe/cards?lat=-8.5069&lng=115.2625&radius=10000&budgetId=1&tagIds=3 - Budget beaches within 10km`,
  })
  @ApiQuery({
    name: 'lat',
    type: Number,
    required: true,
    example: -8.5069,
    description: 'Latitude of your current location (REQUIRED). Must be provided together with lng.',
  })
  @ApiQuery({
    name: 'lng',
    type: Number,
    required: true,
    example: 115.2625,
    description: 'Longitude of your current location (REQUIRED). Must be provided together with lat.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number for pagination (1-indexed, default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 5,
    description: 'Number of places per page (default: 5)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by place category. Optional.',
  })
  @ApiQuery({
    name: 'regencyId',
    type: Number,
    required: false,
    description: 'Filter by regency ID (numeric). Optional. Use /swipe/regencies to get IDs.',
  })
  @ApiQuery({
    name: 'tagIds',
    required: false,
    description: 'Filter by one or more tag IDs (comma-separated). Places matching ANY of the tags will be returned. Optional. Use /swipe/tags to get IDs.',
  })
  @ApiQuery({
    name: 'radius',
    type: Number,
    required: false,
    description: 'Search radius in meters (default: 10000). Only used when lat and lng are provided.',
  })
  @ApiQuery({
    name: 'budgetId',
    type: Number,
    required: false,
    description: 'Filter by budget tier ID. Use /swipe/budgets to get available budget tiers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of place cards sorted by distance from your location',
    schema: {
      example: {
        data: [
          {
            id: 199,
            name: 'Waterbom Bali',
            rating: 4.7,
            totalRatings: 18191,
            priceLevel: 3,
            price: 150000,
            category: 'tourist_attraction',
            address: 'Jl. Raya Waterbom, Badung, Bali',
            district: 'Badung',
            regency: {
              id: 1,
              name: 'Kabupaten Badung',
            },
            province: 'Bali',
            description: 'A tropical water park offering various water attractions and recreational facilities',
            tags: [
              {
                id: 1,
                name: 'sightseeing',
                iconName: 'binoculars',
              },
              {
                id: 2,
                name: 'family-friendly',
                iconName: 'person.2',
              },
              {
                id: 8,
                name: 'entertainment',
                iconName: 'ticket',
              },
            ],
            photoUrl: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=AaRybjpP...',
            coordinates: {
              lat: -8.7211,
              lng: 115.1691,
            },
            distance: 2450,
            driveTimeMinutes: 6,
          },
        ],
        meta: {
          total: 156,
          page: 1,
          limit: 10,
          totalPages: 16,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - lat and lng are required parameters',
  })
  async getCards(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('category') category?: string,
    @Query('regencyId') regencyId?: string,
    @Query('tagIds') tagIds?: string,
    @Query('radius') radius?: string,
    @Query('budgetId') budgetId?: string,
  ) {
    if (!lat || !lng) {
      throw new Error('lat and lng are required parameters');
    }
    return await this.swipeService.getCards(
      parseFloat(lat),
      parseFloat(lng),
      +page,
      +limit,
      category,
      regencyId !== undefined ? parseInt(regencyId) : undefined,
      tagIds,
      radius !== undefined ? parseFloat(radius) : undefined,
      budgetId !== undefined ? parseInt(budgetId) : undefined,
    );
  }

  @Get('tags')
  @ApiOperation({
    summary: 'Get all available tags for filtering',
    description: `Returns a list of all available tags with their SF Symbol icon names.

Each tag includes:
- id: Unique tag identifier
- name: Tag name (use in /swipe/cards?tags=name query parameter)
- iconName: SF Symbol icon name for iOS/mobile UI display

Tags can be used individually or combined as comma-separated values in the tags query parameter.
Placing a place can have multiple tags, and filtering returns places that match ANY of the specified tags.

Common tags: nature, outdoor, sightseeing, family-friendly, culture, dining, accommodation, etc.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all available tags ordered alphabetically by name',
    schema: {
      example: [
        {
          id: 1,
          name: 'accommodation',
          iconName: 'building.2',
        },
        {
          id: 2,
          name: 'art',
          iconName: 'paintbrush',
        },
        {
          id: 3,
          name: 'beachfront',
          iconName: 'water.waves',
        },
        {
          id: 4,
          name: 'culture',
          iconName: 'building.2',
        },
        {
          id: 5,
          name: 'dining',
          iconName: 'fork.knife',
        },
        {
          id: 6,
          name: 'education',
          iconName: 'book',
        },
        {
          id: 7,
          name: 'entertainment',
          iconName: 'ticket',
        },
        {
          id: 8,
          name: 'family-friendly',
          iconName: 'person.2',
        },
        {
          id: 9,
          name: 'nature',
          iconName: 'leaf',
        },
        {
          id: 10,
          name: 'outdoor',
          iconName: 'tree',
        },
        {
          id: 11,
          name: 'sightseeing',
          iconName: 'binoculars',
        },
        {
          id: 12,
          name: 'wildlife',
          iconName: 'pawprint',
        },
      ],
    },
  })
  async getTags() {
    return await this.swipeService.getTags();
  }

  @Get('regencies')
  @ApiOperation({
    summary: 'Get all available regencies for filtering',
    description: `Returns a list of all Bali regencies (administrative districts) ordered alphabetically.

Each regency includes:
- id: Unique regency identifier
- name: Full regency name (use in /swipe/cards?regency=name query parameter)

Bali has 8 regencies total:
- 6 Kabupaten (regency/district): Badung, Gianyar, Buleleng, Bangli, Klungkung, Tabanan
- 1 Kota (city): Denpasar

Use regency names to filter places by location. Query parameter requires exact match (case-sensitive and URL-encoded if spaces).`,
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all Bali regencies ordered alphabetically by name',
    schema: {
      example: [
        {
          id: 1,
          name: 'Kabupaten Badung',
        },
        {
          id: 2,
          name: 'Kabupaten Bangli',
        },
        {
          id: 3,
          name: 'Kabupaten Buleleng',
        },
        {
          id: 4,
          name: 'Kabupaten Gianyar',
        },
        {
          id: 5,
          name: 'Kabupaten Klungkung',
        },
        {
          id: 6,
          name: 'Kabupaten Tabanan',
        },
        {
          id: 7,
          name: 'Kota Denpasar',
        },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Empty array if no regencies exist in database',
  })
  async getRegencies() {
    return await this.swipeService.getRegencies();
  }

  @Get('regencies/:id/tags')
  @ApiOperation({
    summary: 'Get available tags for a specific regency',
    description: 'Returns only the tags that are actually used by places in the given regency. Useful for building dynamic filter UI per location.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Regency ID (get IDs from /swipe/regencies)',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Regency info with its available tags ordered alphabetically',
    schema: {
      example: {
        regency: {
          id: 2,
          name: 'Kabupaten Gianyar',
        },
        tags: [
          { id: 9, name: 'nature', iconName: 'leaf' },
          { id: 6, name: 'outdoor', iconName: 'tree' },
          { id: 1, name: 'sightseeing', iconName: 'binoculars' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Regency not found',
  })
  async getTagsByRegency(@Param('id', ParseIntPipe) id: number) {
    const result = await this.swipeService.getTagsByRegency(id);
    if (!result) throw new NotFoundException(`Regency with id ${id} not found`);
    return result;
  }

  @Get('budgets')
  @ApiOperation({
    summary: 'Get all available budget tiers for filtering',
    description: `Returns predefined budget tiers with min/max price ranges in Indonesian Rupiah (IDR).

Budget Tiers:
- Budget (id: 1): 0 - 75,000 IDR - affordable activities, temples, basic attractions
- Mid-Range (id: 2): 75,000 - 200,000 IDR - most popular places, good value
- Premium (id: 3): 200,000 - 500,000 IDR - high-end experiences, water parks, luxury activities

Use the tier ID to filter places in /swipe/cards?budgetId=<id>

Current price statistics across all places:
- Minimum: 25,000 IDR
- Maximum: 500,000 IDR
- Average: 148,889 IDR
- 63 places have pricing data out of 76 total`,
  })
  @ApiResponse({
    status: 200,
    description: 'Array of budget tiers ordered by minimum price',
    schema: {
      example: [
        {
          id: 1,
          name: 'Budget',
          minPrice: 0,
          maxPrice: 75000,
        },
        {
          id: 2,
          name: 'Mid-Range',
          minPrice: 75000,
          maxPrice: 200000,
        },
        {
          id: 3,
          name: 'Premium',
          minPrice: 200000,
          maxPrice: 500000,
        },
      ],
    },
  })
  async getBudgets() {
    return await this.swipeService.getBudgets();
  }
}
