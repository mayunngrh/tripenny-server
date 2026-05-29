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
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Place, Tag],
      synchronize: true,
      logging: true,
    }),
    CrawlerModule,
    SwipeModule,
  ],
})
export class AppModule {}
