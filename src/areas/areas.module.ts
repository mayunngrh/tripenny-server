import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { Area } from '../entities/area.entity';
import { Regency } from '../entities/regency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Area, Regency])],
  providers: [AreasService],
  controllers: [AreasController],
})
export class AreasModule {}
