import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwipeService } from './swipe.service';
import { SwipeController } from './swipe.controller';
import { Place } from '../entities/place.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Place]), ],
  providers: [SwipeService],
  controllers: [SwipeController],
})
export class SwipeModule {}
