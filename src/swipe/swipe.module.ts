import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwipeService } from './swipe.service';
import { SwipeController } from './swipe.controller';
import { Place } from '../entities/place.entity';
import { Tag } from '../entities/tag.entity';
import { Regency } from '../entities/regency.entity';
import { Budget } from '../entities/budget.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Place, Tag, Regency, Budget])],
  providers: [SwipeService],
  controllers: [SwipeController],
})
export class SwipeModule {}
