import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { Regency } from '../entities/regency.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
    @InjectRepository(Regency)
    private regencyRepository: Repository<Regency>,
  ) {}

  async searchArea(query: string) {
    if (!query || query.length < 1) {
      return [];
    }

    const areas = await this.areaRepository
      .createQueryBuilder('area')
      .leftJoinAndSelect('area.regency', 'regency')
      .where('LOWER(area.name) LIKE LOWER(:query)', { query: `${query}%` })
      .orderBy('area.name', 'ASC')
      .getMany();

    return areas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      regency: area.regency
        ? {
            id: area.regency.id,
            name: area.regency.name,
          }
        : null,
    }));
  }

  async getPopularAreas() {
    try {
      // Get all areas with their regencies
      const areas = await this.areaRepository
        .createQueryBuilder('area')
        .leftJoinAndSelect('area.regency', 'regency')
        .orderBy('area.name', 'ASC')
        .getMany();

      console.log('Found areas:', areas.length);

      return areas.map((area) => ({
        id: area.id,
        name: area.name,
        description: area.description,
        regency: area.regency
          ? {
              id: area.regency.id,
              name: area.regency.name,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error in getPopularAreas:', error);
      throw error;
    }
  }

  async seedAreas() {
    const areasData = [
      { name: 'Ubud', regencyId: 2, description: 'Cultural heart of Bali with arts, crafts, and nature' },
      { name: 'Canggu', regencyId: 1, description: 'Digital nomad hub with surfing, cafes, and nightlife' },
      { name: 'Seminyak', regencyId: 1, description: 'Trendy beach area with bars, restaurants, and sunset views' },
      { name: 'Kuta', regencyId: 1, description: 'Popular beach town with waves and nightlife' },
      { name: 'Jimbaran', regencyId: 1, description: 'Peaceful beach with seafood dining' },
      { name: 'Uluwatu', regencyId: 1, description: 'Clifftop temples and ocean views' },
      { name: 'Nusa Dua', regencyId: 1, description: 'Modern resort area with beaches' },
      { name: 'Sanur', regencyId: 1, description: 'Laid-back beach town' },
      { name: 'Pecatu', regencyId: 1, description: 'Clifftop area with temples' },
      { name: 'Tanjung Benoa', regencyId: 1, description: 'Water sports and beach activities' },
      { name: 'Bedugul', regencyId: 7, description: 'Mountain town with lakes and gardens' },
      { name: 'Kintamani', regencyId: 7, description: 'Volcanic highlands with views' },
      { name: 'Jatiluwih', regencyId: 7, description: 'Terraced rice paddies UNESCO site' },
      { name: 'Tabanan', regencyId: 7, description: 'Rice terraces and rural Bali' },
      { name: 'Amed', regencyId: 8, description: 'Quiet coastal town for diving' },
      { name: 'Rendang', regencyId: 8, description: 'Mountain village with culture' },
      { name: 'Manggisari', regencyId: 8, description: 'Traditional village area' },
      { name: 'Buleleng', regencyId: 3, description: 'Northern coast with diving' },
      { name: 'Gerokgak', regencyId: 3, description: 'Coastal area' },
      { name: 'Sambang', regencyId: 3, description: 'Northern beach area' },
      { name: 'Sekumpul', regencyId: 3, description: 'Waterfall destination' },
      { name: 'Gianyar', regencyId: 2, description: 'Cultural district' },
      { name: 'Bangli', regencyId: 4, description: 'Highland town' },
      { name: 'Klungkung', regencyId: 5, description: 'Royal palace town' },
      { name: 'Denpasar', regencyId: 6, description: 'Capital city' },
      { name: 'Pekutatan', regencyId: 9, description: 'Western Bali' },
      { name: 'Nusa Penida', regencyId: 5, description: 'Island destination' },
      { name: 'Tegallalang', regencyId: 2, description: 'Famous rice terraces' },
      { name: 'Padang Padang', regencyId: 1, description: 'Hidden beach cove' },
      { name: 'Lembongan', regencyId: 5, description: 'Island near Nusa Penida' },
    ];

    const created: string[] = [];
    for (const data of areasData) {
      const existing = await this.areaRepository.findOne({
        where: { name: data.name },
      });

      if (!existing) {
        const area = this.areaRepository.create({
          name: data.name,
          regencyId: data.regencyId,
          description: data.description,
        });
        await this.areaRepository.save(area);
        created.push(data.name);
      }
    }

    return { success: true, created: created.length, areas: created };
  }
}
