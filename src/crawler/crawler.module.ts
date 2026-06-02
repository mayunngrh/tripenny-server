import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import { Place } from '../entities/place.entity';
import { Tag } from '../entities/tag.entity';
import { Regency } from '../entities/regency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Place, Tag, Regency])],
  providers: [CrawlerService],
  controllers: [CrawlerController],
  exports: [CrawlerService],
})
export class CrawlerModule {}
