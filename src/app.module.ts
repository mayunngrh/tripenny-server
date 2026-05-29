import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerModule } from './crawler/crawler.module';
import { SwipeModule } from './swipe/swipe.module';
import { Place } from './entities/place.entity';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Place, Tag],
      synchronize: true,
      logging: true,
      ssl: { rejectUnauthorized: false },
    }),
    CrawlerModule,
    SwipeModule,
  ],
})
export class AppModule { }
