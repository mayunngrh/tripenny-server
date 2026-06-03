import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { Plan } from '../entities/plan.entity';
import { PlanItem } from '../entities/plan-item.entity';
import { Place } from '../entities/place.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanItem, Place])],
  providers: [PlanService],
  controllers: [PlanController],
})
export class PlanModule {}
