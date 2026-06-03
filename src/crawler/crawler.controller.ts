import { Controller, Post, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private crawlerService: CrawlerService) {}

  // POST /crawler/crawl?lat=-8.7211&lon=115.1691&category=tourist_attraction&radius=10000&limit=3
  // OR: POST /crawler/crawl?lat=-8.7211&lon=115.1691&keyword=kecak&radius=10000&limit=3
  @Post('crawl')
  @ApiOperation({
    summary: 'Crawl Google Places and save results to the database',
  })
  @ApiQuery({ name: 'lat', type: Number, example: -8.7211 })
  @ApiQuery({ name: 'lon', type: Number, example: 115.1691 })
  @ApiQuery({ name: 'category', required: false, example: 'tourist_attraction' })
  @ApiQuery({ name: 'keyword', required: false, example: 'kecak' })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 10000 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 3 })
  async crawl(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('radius') radius: number = 10000,
    @Query('limit') limit?: number,
  ) {
    if (!lat || !lon) {
      return { error: 'lat and lon are required' };
    }
    if (!category && !keyword) {
      return { error: 'either category or keyword is required' };
    }
    return await this.crawlerService.crawl(
      +lat,
      +lon,
      category,
      keyword,
      +radius,
      limit ? +limit : undefined,
    );
  }

  // GET /crawler/places
  @Get('places')
  @ApiOperation({ summary: 'Get all saved places (with photoUrl), highest rated first' })
  async getAllPlaces() {
    return await this.crawlerService.getAllPlaces();
  }

  // GET /crawler/category?type=restaurant
  @Get('category')
  @ApiOperation({ summary: 'Get places filtered by category' })
  @ApiQuery({ name: 'type', example: 'restaurant' })
  async getByCategory(@Query('type') type: string) {
    if (!type) return { error: 'type parameter is required' };
    return await this.crawlerService.getPlacesByCategory(type);
  }

  // GET /crawler/search?query=noodle
  @Get('search')
  @ApiOperation({ summary: 'Search places by name or address' })
  @ApiQuery({ name: 'query', example: 'noodle' })
  async search(@Query('query') query: string) {
    if (!query) return { error: 'query parameter is required' };
    return await this.crawlerService.searchPlaces(query);
  }

  // GET /crawler/price?level=2  (0=free, 1=cheap, 2=moderate, 3=expensive, 4=very expensive)
  @Get('price')
  @ApiOperation({
    summary:
      'Get places by price level (0=free, 1=cheap, 2=moderate, 3=expensive, 4=very expensive)',
  })
  @ApiQuery({ name: 'level', type: Number, example: 2 })
  async getByPrice(@Query('level') level: number) {
    if (level === undefined) return { error: 'level parameter is required' };
    return await this.crawlerService.getPlacesByPriceLevel(+level);
  }

  // GET /crawler/tags?tag=family-friendly
  @Get('tags')
  @ApiOperation({ summary: 'Get places that have a given tag' })
  @ApiQuery({ name: 'tag', example: 'family-friendly' })
  async getByTag(@Query('tag') tag: string) {
    if (!tag) return { error: 'tag parameter is required' };
    return await this.crawlerService.getPlacesByTag(tag);
  }

  // POST /crawler/bulk-crawl
  @Post('bulk-crawl')
  @ApiOperation({
    summary: 'Seed tags + crawl all new categories (art, history, landmark, surfing, trekking, snorkeling, etc.) in one call',
    description: 'Runs seed-tags first, then crawls ~15 keyword/category jobs across Bali to add 20+ new places. Takes 1-3 minutes.',
  })
  async bulkCrawl() {
    return await this.crawlerService.bulkCrawl();
  }

  // POST /crawler/seed-tags
  @Post('seed-tags')
  @ApiOperation({ summary: 'Seed new tags (art, history, landmark, surfing, trekking, etc.) into the database' })
  async seedTags() {
    return await this.crawlerService.seedTags();
  }

  // POST /crawler/update-photos
  @Post('update-photos')
  @ApiOperation({ summary: 'Refresh photoReference for all places from Google' })
  async updateAllPhotoReferences() {
    return await this.crawlerService.updateAllPhotoReferences();
  }
}
