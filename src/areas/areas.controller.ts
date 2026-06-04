import { Controller, Get, Query, NotFoundException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AreasService } from './areas.service';

/**
 * AREAS API - Famous Tourist Areas Discovery
 *
 * Discover and search for famous tourist areas in Bali with their regencies.
 * Areas are distinct tourist destinations like Ubud, Canggu, Seminyak, etc.
 *
 * KEY CONCEPT - Areas:
 * - AREAS: Famous tourist destinations (Ubud, Canggu, Seminyak, Bedugul, etc.) - 30 total
 * - Each area belongs to ONE regency
 * - Areas are what users think about and search for
 * - Perfect for building a destination search/discovery UI
 *
 * TYPICAL USER WORKFLOW:
 * 1. User searches for area → GET /areas/search?area=ubud
 * 2. Returns area with regency information
 * 3. User can then filter places by that area/regency
 *
 * AVAILABLE ENDPOINTS:
 * - GET /areas/search?area=ubud - Search for specific area
 * - GET /areas/popular - Browse all 30 famous areas
 * - POST /areas/seed - Seed 30 famous areas (admin only)
 */

@ApiTags('areas')
@Controller('areas')
export class AreasController {
  constructor(private areasService: AreasService) {}

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocomplete/prefix search for areas',
    description: `Real-time autocomplete search for areas as user types.

HOW IT WORKS:
- Type any prefix to get matching areas
- Returns all areas that START WITH the typed text
- Results sorted alphabetically

EXAMPLES:
- /areas/autocomplete?q=be → Bedugul
- /areas/autocomplete?q=ub → Ubud
- /areas/autocomplete?q=ka → Kuta, Kintamani
- /areas/autocomplete?q=am → Amed
- /areas/autocomplete?q=se → Seminyak, Sekumpul
- /areas/autocomplete?q=bu → Buleleng, Bedugul

TYPICAL UI FLOW:
User types in search box and gets live suggestions with regency info.`,
  })
  @ApiQuery({
    name: 'q',
    type: String,
    required: true,
    example: 'be',
    description: 'Search query prefix (case-insensitive). Examples: be, ub, ka, am, se',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching areas with regency info',
    schema: {
      example: [
        {
          id: 41,
          name: 'Bedugul',
          description: 'Mountain town with lakes and gardens',
          regency: {
            id: 7,
            name: 'Kabupaten Tabanan',
          },
        },
      ],
    },
  })
  async autocompleteArea(@Query('q') query: string) {
    return await this.areasService.autocompleteArea(query);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search for a famous tourist area',
    description: `Search for a specific famous tourist area in Bali and get its regency information.

WHAT YOU GET:
- Area name (e.g., "Ubud", "Canggu")
- Area description
- Regency ID and name (administrative region)

EXAMPLE:
Search: /areas/search?area=ubud
Response:
{
  "id": 1,
  "name": "Ubud",
  "description": "Cultural heart of Bali with arts, crafts, and nature",
  "regency": { "id": 2, "name": "Kabupaten Gianyar" }
}

SUPPORTED AREAS (30 total):
Ubud, Canggu, Seminyak, Kuta, Jimbaran, Uluwatu, Nusa Dua, Sanur, Pecatu,
Tanjung Benoa, Bedugul, Kintamani, Jatiluwih, Tabanan, Amed, Rendang, Manggisari,
Buleleng, Gerokgak, Sambang, Sekumpul, Gianyar, Bangli, Klungkung, Denpasar,
Pekutatan, Nusa Penida, Tegallalang, Padang Padang, Lembongan`,
  })
  @ApiQuery({
    name: 'area',
    type: String,
    required: true,
    example: 'ubud',
    description: 'Area name (case-insensitive, exact match). Examples: Ubud, Seminyak, Canggu, Kuta, Bedugul',
  })
  @ApiResponse({
    status: 200,
    description: 'Area found with regency information',
    schema: {
      example: {
        id: 1,
        name: 'Ubud',
        description: 'Cultural heart of Bali with arts, crafts, and nature',
        regency: {
          id: 2,
          name: 'Kabupaten Gianyar',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Area not found',
  })
  async searchArea(@Query('area') area: string) {
    const result = await this.areasService.searchArea(area);
    if (!result) throw new NotFoundException(`Area "${area}" not found`);
    return result;
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get all 30 famous tourist areas in Bali',
    description: `Get complete list of all 30 famous tourist areas with their regencies and descriptions.

Perfect for:
- Build area selection dropdown/list for users
- "Browse by area" feature on homepage
- Getting all available areas for discovery
- Building destination-based search UI

RESPONSE INCLUDES:
- Area name and description
- Regency ID and name (for filtering)

EXAMPLE AREAS:
Beach areas: Ubud, Canggu, Seminyak, Kuta, Jimbaran, Uluwatu, Nusa Dua, Sanur
Mountain areas: Bedugul, Kintamani, Jatiluwih, Tabanan
North coast: Buleleng, Gerokgak, Sambang, Sekumpul
East areas: Amed, Rendang, Manggisari
And more...`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all 30 areas',
    schema: {
      example: [
        {
          id: 1,
          name: 'Ubud',
          description: 'Cultural heart of Bali with arts, crafts, and nature',
          regency: { id: 2, name: 'Kabupaten Gianyar' },
        },
        {
          id: 2,
          name: 'Canggu',
          description: 'Digital nomad hub with surfing, cafes, and nightlife',
          regency: { id: 1, name: 'Kabupaten Badung' },
        },
      ],
    },
  })
  async getPopularAreas() {
    return await this.areasService.getPopularAreas();
  }

  @Post('seed')
  @ApiOperation({
    summary: 'Seed 30 famous areas (admin only)',
    description: 'Initialize database with 30 famous tourist areas in Bali',
  })
  @ApiResponse({
    status: 200,
    description: 'Areas seeded successfully',
  })
  async seedAreas() {
    return await this.areasService.seedAreas();
  }
}
