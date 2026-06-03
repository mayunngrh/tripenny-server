import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SwipeService } from './swipe.service';

/**
 * AREAS API - Tourist Area Discovery & Location-Based Filtering
 *
 * Help users discover and filter places by popular tourist areas in Bali.
 * Areas are districts/zones like Ubud, Seminyak, Canggu, Bedugul, etc.
 *
 * KEY CONCEPT - Areas vs Regencies:
 * - AREAS: Tourist zones/districts (Ubud, Canggu, Seminyak, Bedugul, etc.) - 29 total
 * - REGENCIES: Administrative regions (Kabupaten Badung, Kabupaten Gianyar, etc.) - 11 total
 * - Each area belongs to ONE regency
 * - Areas are what users think about, regencies are used for backend filtering
 *
 * SEED DATA:
 * - 33 famous landmarks seeded across the 29 areas
 * - These landmarks help establish the area → regency mapping
 * - When filtering /swipe/cards, returns ALL places in that regency (not just the 33)
 *
 * Why areas matter:
 * - Users think in areas ("I want to explore Ubud") not regencies
 * - Each area maps to a regencyId for place filtering
 * - Real-time autocomplete for smooth search experience
 * - Helps users discover regencies through familiar area names
 *
 * TYPICAL USER WORKFLOW:
 * 1. User searches for area → GET /areas/search?area=bedugul
 * 2. Returns regencyId + 3-5 famous landmarks in Bedugul
 * 3. User gets current location → lat=-8.25, lng=115.18
 * 4. Filter all places in that regency → GET /swipe/cards?lat=-8.25&lng=115.18&regency=Kabupaten%20Tabanan
 * 5. Returns 50+ places in that regency sorted by distance + drive time
 *
 * AVAILABLE ENDPOINTS:
 * - GET /areas/search?area=ubud - Search for area, get regency + sample famous places
 * - GET /areas/popular - Browse all 29 areas with stats
 *
 * AREAS AVAILABLE (29 total):
 * South Bali (Beach): Ubud, Canggu, Seminyak, Kuta, Jimbaran, Uluwatu, Pecatu, Nusa Dua, Sanur, Tanjung Benoa
 * Mountains: Bedugul, Kintamani, Jatiluwih, Tabanan
 * North: Buleleng, Gerokgak, Sambang, Sekumpul
 * East: Amed, Abang, Rendang, Manggisari
 * City: Denpasar
 * Cultural: Ubud, Gianyar, Bangli, Klungkung
 * Island: Nusa Penida
 * West: Pekutatan
 * And more...
 */

@ApiTags('areas')
@Controller('areas')
export class SwipeAreasController {
  constructor(private swipeService: SwipeService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for a tourist area and get its regencyId',
    description: `Search for a specific tourist area name (exact match) and get the regencyId plus information.

WHAT YOU GET:
- Area name (e.g., "Ubud", "Bedugul")
- Regency ID and name (used for filtering)
- Count of famous landmarks seeded in this area (3-5)
- Average rating of those landmarks
- Sample list of top-rated famous places (for preview)

WHAT HAPPENS NEXT:
1. Use the regencyId to filter in /swipe/cards
2. You'll get ALL places in that regency (not just the 3-5 famous ones)
3. Places sorted by distance + estimated drive time from user's location

EXAMPLE FLOW:
Search: /areas/search?area=bedugul
Response:
{
  "area": "Bedugul",
  "regency": { "id": 7, "name": "Kabupaten Tabanan" },
  "placeCount": 3,  ← Famous landmarks seeded here
  "avgRating": 4.60,
  "placeSummary": [
    { "name": "Lake Bratan Temple", "rating": 4.7, ... },
    { "name": "Bedugul Botanical Garden", "rating": 4.6, ... },
    { "name": "Bedugul Market", "rating": 4.5, ... }
  ]
}

Then: GET /swipe/cards?lat=-8.27&lng=115.18&regency=Kabupaten%20Tabanan
Returns: 20+ places in Tabanan (all categories, not just the 3 famous ones)

SUPPORTED AREAS (29 total):
Ubud, Canggu, Seminyak, Kuta, Bedugul, Nusa Penida, Amed, Sanur, Jimbaran, Nusa Dua, and more.`,
  })
  @ApiQuery({
    name: 'area',
    type: String,
    required: true,
    example: 'ubud',
    description: 'Area/district name (case-insensitive, exact match). Examples: Ubud, Seminyak, Canggu, Kuta, Bedugul, Amed',
  })
  @ApiResponse({
    status: 200,
    description: 'Area found with regency information',
    schema: {
      example: {
        area: 'Ubud',
        regency: {
          id: 2,
          name: 'Kabupaten Gianyar',
        },
        placeCount: 5,
        avgRating: 4.56,
        placeSummary: [
          {
            id: 359,
            name: 'Wild Current Rafting',
            rating: 4.9,
            price: 450000,
            category: 'river rafting',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Area not found',
  })
  async searchArea(@Query('area') area: string) {
    return await this.swipeService.searchAreaByName(area);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get 4 random popular tourist areas in Bali',
    description: `Get 4 randomly selected tourist areas with their regencies and statistics.

Perfect for:
- Homepage "Explore random areas" feature
- Discovery cards on landing page
- Getting a quick overview of different regions

DATA RETURNED (random selection):
- Area name (e.g., "Ubud", "Bedugul")
- Regency ID and name
- Number of seeded famous landmarks (3-5 per area)
- Average rating of those landmarks

EXAMPLE:
{
  "area": "Ubud",
  "regency": { "id": 2, "name": "Kabupaten Gianyar" },
  "placeCount": 5,
  "avgRating": "4.56"
}

Then users can click an area to see ALL places in that regency via /swipe/cards`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of popular areas with regency info',
    schema: {
      example: [
        {
          area: 'Ubud',
          regency: { id: 2, name: 'Kabupaten Gianyar' },
          placeCount: 5,
          avgRating: 4.56,
          description: 'Cultural heart of Bali with arts, crafts, and nature',
        },
        {
          area: 'Seminyak',
          regency: { id: 1, name: 'Kabupaten Badung' },
          placeCount: 2,
          avgRating: 4.65,
          description: 'Trendy beach area with bars, restaurants, and sunset views',
        },
        {
          area: 'Canggu',
          regency: { id: 1, name: 'Kabupaten Badung' },
          placeCount: 2,
          avgRating: 4.70,
          description: 'Digital nomad hub with surfing, cafes, and nightlife',
        },
      ],
    },
  })
  async getPopularAreas() {
    return await this.swipeService.getPopularAreas();
  }


}
