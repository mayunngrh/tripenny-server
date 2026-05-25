import { Controller, Get, Query } from '@nestjs/common';
import { SwipeService } from './swipe.service';

@Controller('swipe')
export class SwipeController {
  constructor(private swipeService: SwipeService) {}

  // GET /swipe/cards?page=1&limit=5&category=restaurant
  @Get('cards')
  async getCards(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('category') category?: string,
  ) {
    return await this.swipeService.getCards(+page, +limit, category);
  }
}
