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
   * 1. Call /swipe/tags to get available tags for filtering
   * 2. Call /swipe/regencies to get available regencies (districts/cities)
   * 3. Call /swipe/cards with filters to get places matching your criteria
   *
   * Filter Combinations:
   * - Single regency: /swipe/cards?regency=Kota%20Denpasar
   * - Single tag: /swipe/cards?tags=nature
   * - Multiple tags: /swipe/cards?tags=nature,outdoor (returns places with ANY tag)
   * - Regency + tags: /swipe/cards?regency=Kota%20Denpasar&tags=nature,outdoor
   * - Category filter: /swipe/cards?category=tourist_attraction
   * - All filters combined: /swipe/cards?category=tourist_attraction&regency=Kota%20Denpasar&tags=nature
   */

  @Get('cards')
  @ApiOperation({
    summary: 'Get paginated place cards for swiping',
    description: `Returns place data optimized for swipe interface with filtering capabilities.

Filtering:
- category: Filter by place type (e.g., tourist_attraction, restaurant, museum)
- regency: Filter by Bali regency/district name (exact match, case-sensitive)
- tags: Filter by one or more tags separated by commas (returns places with ANY matching tag)

All filters are optional and can be combined. Results are sorted by rating (highest first).
Use /swipe/tags and /swipe/regencies to discover available filter values.

Examples:
- /swipe/cards?page=1&limit=10 - Get first 10 places
- /swipe/cards?regency=Kota%20Denpasar - Get places in Denpasar
- /swipe/cards?tags=nature,outdoor - Get places tagged as nature OR outdoor
- /swipe/cards?regency=Kota%20Denpasar&tags=nature - Get nature places in Denpasar`,
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
    example: 10,
    description: 'Number of places per page (default: 5)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'tourist_attraction',
    description: 'Filter by place category. Optional.',
  })
  @ApiQuery({
    name: 'regency',
    required: false,
    example: 'Kota Denpasar',
    description: 'Filter by regency/district name (exact match). Optional. Use /swipe/regencies to see available values.',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    example: 'nature,outdoor',
    description: 'Filter by one or more tags (comma-separated, case-sensitive). Places matching ANY of the tags will be returned. Optional. Use /swipe/tags to see available values.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of place cards with complete information for display',
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
    description: 'Bad request - invalid query parameters',
  })
  async getCards(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('category') category?: string,
    @Query('regency') regency?: string,
    @Query('tags') tags?: string,
  ) {
    return await this.swipeService.getCards(
      +page,
      +limit,
      category,
      regency,
      tags,
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
}
