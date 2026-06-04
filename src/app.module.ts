import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerModule } from './crawler/crawler.module';
import { SwipeModule } from './swipe/swipe.module';
import { PlanModule } from './plan/plan.module';
import { AreasModule } from './areas/areas.module';
import { Place } from './entities/place.entity';
import { Tag } from './entities/tag.entity';
import { Regency } from './entities/regency.entity';
import { Budget } from './entities/budget.entity';
import { Plan } from './entities/plan.entity';
import { PlanItem } from './entities/plan-item.entity';
import { Area } from './entities/area.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Place, Tag, Regency, Budget, Plan, PlanItem, Area],
      synchronize: true,
      logging: true,
      ssl: { rejectUnauthorized: false },
    }),
    CrawlerModule,
    SwipeModule,
    PlanModule,
    AreasModule,
  ],
})
export class AppModule { }
