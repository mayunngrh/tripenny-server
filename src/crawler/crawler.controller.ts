import { Controller, Post, Get, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private crawlerService: CrawlerService) {}

  // POST /crawler/crawl?lat=-8.7211&lon=115.1691&category=restaurant&radius=10000
  @Post('crawl')
  async crawl(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('category') category: string = 'restaurant',
    @Query('radius') radius: number = 10000,
  ) {
    if (!lat || !lon) {
      return { error: 'lat and lon are required' };
    }
    return await this.crawlerService.crawl(+lat, +lon, category, +radius);
  }

  // GET /crawler/places
  @Get('places')
  async getAllPlaces() {
    return await this.crawlerService.getAllPlaces();
  }

  // GET /crawler/category?type=restaurant
  @Get('category')
  async getByCategory(@Query('type') type: string) {
    if (!type) return { error: 'type parameter is required' };
    return await this.crawlerService.getPlacesByCategory(type);
  }

  // GET /crawler/search?query=noodle
  @Get('search')
  async search(@Query('query') query: string) {
    if (!query) return { error: 'query parameter is required' };
    return await this.crawlerService.searchPlaces(query);
  }

  // GET /crawler/price?level=2  (0=free, 1=cheap, 2=moderate, 3=expensive, 4=very expensive)
  @Get('price')
  async getByPrice(@Query('level') level: number) {
    if (level === undefined) return { error: 'level parameter is required' };
    return await this.crawlerService.getPlacesByPriceLevel(+level);
  }
}
