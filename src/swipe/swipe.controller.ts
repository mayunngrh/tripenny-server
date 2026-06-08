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
   * KEY FEATURES:
   * - Returns ALL matching places (no pagination)
   * - Distance calculated from user's lat/lng coordinates
   * - Drive time estimated based on 50 km/h average speed
   * - Results sorted by distance (nearest first)
   *
   * Workflow:
   * 1. Call /swipe/tags to get available tags with their IDs for filtering
   * 2. Call /swipe/regencies to get available regencies (districts/cities) with their IDs
   * 3. Call /swipe/budgets to get available budget tiers
   * 4. Call /swipe/cards with filters to get places matching your criteria
   *
   * Filter Examples:
   * - All places: /swipe/cards?lat=-8.5069&lng=115.2625
   * - By regency: /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=4 (Bangli - returns all 2 places)
   * - By tags: /swipe/cards?lat=-8.5069&lng=115.2625&tagIds=1,9 (places with tag 1 OR 9)
   * - By radius: /swipe/cards?lat=-8.5069&lng=115.2625&radius=50000 (within 50km)
   * - By budget: /swipe/cards?lat=-8.5069&lng=115.2625&budgetId=2 (Mid-Range: 75k-200k IDR)
   * - Combined: /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=2&tagIds=1 (Gianyar + tag 1)
   * - By category: /swipe/cards?lat=-8.5069&lng=115.2625&category=tourist_attraction
   */

  @Get('cards')
  @ApiOperation({
    summary: 'Get all place cards sorted by distance and drive time from your location',
    description: `Returns all matching places with distance and estimated drive time, sorted by distance from your location.

No pagination - returns all results in a simple array.

REQUIRED Parameters:
- lat: Your current latitude (e.g., -8.5069)
- lng: Your current longitude (e.g., 115.2625)

OPTIONAL Filters:
- radius: Search radius in meters (e.g., 50000 for 50km). If not provided, no distance limit
- regencyId: Filter by regency ID to get all places in that specific regency
- tagIds: Filter by tag IDs (comma-separated) to get places with those tags
- category: Filter by place category
- budgetId: Filter by budget tier

Behavior:
- If NO filters provided: Returns ALL 128 places in database
- If filters ARE provided: Returns only places matching the filters, sorted by distance
- Results always include distance (in meters) and estimated drive time (in minutes)

Response Includes:
- distance: Distance in meters from your location
- driveTimeMinutes: Estimated driving time (based on 50km/h average speed)
- All place details: rating, price, tags, photos, coordinates, etc.

Examples:
- /swipe/cards?lat=-8.5069&lng=115.2625 - All 128 places, sorted by distance
- /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=4 - All 2 places in Bangli regency
- /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=2&tagIds=1,9 - Places in Gianyar with tags 1 or 9
- /swipe/cards?lat=-8.5069&lng=115.2625&radius=50000 - All places within 50km
- /swipe/cards?lat=-8.5069&lng=115.2625&budgetId=2 - All mid-range places`,
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
    name: 'radius',
    type: Number,
    required: false,
    description: 'Search radius in meters (optional). If not provided, returns ALL places regardless of distance.',
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
    description: 'Search radius in meters (optional). If not provided, returns ALL places regardless of distance.',
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
    name: 'budgetId',
    type: Number,
    required: false,
    description: 'Filter by budget tier ID. Use /swipe/budgets to get available budget tiers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Object with count and array of all matching place cards sorted by distance from your location',
    schema: {
      example: {
        count: 2,
        data: [
          {
            id: 199,
            name: 'Waterbom Bali',
            rating: 4.7,
            totalRatings: 18191,
            priceLevel: 3,
            price: 150000,
            parkingFee: 10000,
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
