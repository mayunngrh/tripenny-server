import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../entities/place.entity';
import { Tag } from '../entities/tag.entity';
import { Regency } from '../entities/regency.entity';
import { Budget } from '../entities/budget.entity';

@Injectable()
export class SwipeService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Regency)
    private regencyRepository: Repository<Regency>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
  ) {}

  private calculateDriveTime(distanceMeters: number): number {
    const averageSpeedKmh = 50;
    const distanceKm = distanceMeters / 1000;
    const driveTimeMinutes = Math.round((distanceKm / averageSpeedKmh) * 60);
    return Math.max(driveTimeMinutes, 1);
  }

  async getCards(
    lat: number,
    lng: number,
    page: number = 1,
    limit: number = 5,
    category?: string,
    regencyId?: number,
    tagIds?: string,
    radius?: number,
    budgetId?: number,
  ) {
    if (lat === undefined || lng === undefined) {
      throw new Error('lat and lng are required parameters');
    }

    const skip = (page - 1) * limit;
    const radiusMeters = radius ?? 10000;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.tags', 'tags')
      .leftJoinAndSelect('place.regency', 'regency')
      .select([
        'place.id',
        'place.name',
        'place.rating',
        'place.totalRatings',
        'place.priceLevel',
        'place.price',
        'place.category',
        'place.address',
        'place.district',
        'place.regency',
        'place.province',
        'place.description',
        'place.photoReference',
        'place.latitude',
        'place.longitude',
        'tags.id',
        'tags.name',
        'tags.iconName',
        'regency.id',
        'regency.name',
      ]);

    // Haversine formula — returns distance in meters
    qb.addSelect(
      `(6371000 * acos(
        cos(radians(:lat)) * cos(radians(place.latitude)) *
        cos(radians(place.longitude) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(place.latitude))
      ))`,
      'distance',
    )
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .andWhere(
        `(6371000 * acos(
          cos(radians(:lat)) * cos(radians(place.latitude)) *
          cos(radians(place.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(place.latitude))
        )) <= :radius`,
        { radius: radiusMeters },
      )
      .orderBy('distance', 'ASC');

    if (category) {
      qb.andWhere('place.category = :category', { category });
    }

    if (regencyId) {
      qb.andWhere('regency.id = :regencyId', { regencyId });
    }

    if (tagIds) {
      const tagIdArray = tagIds.split(',').map((id) => parseInt(id.trim(), 10));
      qb.andWhere('tags.id IN (:...tagIdArray)', { tagIdArray });
    }

    if (budgetId) {
      const budget = await this.budgetRepository.findOne({ where: { id: budgetId } });
      if (budget) {
        qb.andWhere('place.price BETWEEN :minPrice AND :maxPrice', {
          minPrice: budget.minPrice,
          maxPrice: budget.maxPrice,
        });
      }
    }

    qb.skip(skip).take(limit);

    const rawAndEntities = await qb.getRawAndEntities();
    const [data, total] = [rawAndEntities.entities, rawAndEntities.entities.length];

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    return {
      data: data.map((p, i) => {
        const distanceMeters = Math.round(parseFloat(rawAndEntities.raw[i]?.distance ?? '0'));
        const driveTimeMinutes = this.calculateDriveTime(distanceMeters);

        return {
          id: p.id,
          name: p.name,
          rating: parseFloat(p.rating as any),
          totalRatings: p.totalRatings,
          priceLevel: p.priceLevel,
          price: p.price,
          category: p.category,
          address: p.address,
          district: p.district,
          regency: p.regency ? { id: p.regency.id, name: p.regency.name } : null,
          province: p.province,
          description: p.description,
          tags: p.tags.map((t) => ({ id: t.id, name: t.name, iconName: t.iconName })),
          photoUrl: p.photoReference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photoReference}&key=${apiKey}`
            : null,
          coordinates: {
            lat: p.latitude,
            lng: p.longitude,
          },
          distance: distanceMeters,
          driveTimeMinutes: driveTimeMinutes,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTags() {
    return await this.tagRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getRegencies() {
    return await this.regencyRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getTagsByRegency(regencyId: number) {
    const regency = await this.regencyRepository.findOne({ where: { id: regencyId } });
    if (!regency) return null;

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.places', 'place')
      .innerJoin('place.regency', 'regency')
      .where('regency.id = :regencyId', { regencyId })
      .select(['tag.id', 'tag.name', 'tag.iconName'])
      .distinct(true)
      .orderBy('tag.name', 'ASC')
      .getMany();

    return { regency: { id: regency.id, name: regency.name }, tags };
  }

  async getBudgets() {
    return await this.budgetRepository.find({
      order: { minPrice: 'ASC' },
    });
  }

  async searchAreaByName(areaName: string) {
    const places = await this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.regency', 'regency')
      .where('LOWER(place.district) = LOWER(:district)', { district: areaName.trim() })
      .orderBy('place.rating', 'DESC')
      .getMany();

    if (places.length === 0) {
      return null;
    }

    const regency = places[0].regency;
    const avgRating = (places.reduce((sum, p) => sum + p.rating, 0) / places.length).toFixed(2);

    return {
      area: places[0].district,
      regency: regency ? { id: regency.id, name: regency.name } : null,
      placeCount: places.length,
      avgRating: parseFloat(avgRating as string),
      placeSummary: places.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        rating: p.rating,
        price: p.price,
        category: p.category,
      })),
    };
  }

  async getPopularAreas() {
    const areas = await this.placeRepository
      .createQueryBuilder('place')
      .select('place.district', 'area')
      .addSelect('regency.id', 'regencyId')
      .addSelect('regency.name', 'regencyName')
      .addSelect('COUNT(place.id)', 'placeCount')
      .addSelect('AVG(place.rating)', 'avgRating')
      .leftJoin('place.regency', 'regency')
      .where('place."placeId" LIKE :prefix', { prefix: 'manual_%' })
      .groupBy('place.district, regency.id, regency.name')
      .getRawMany();

    const shuffled = areas.sort(() => Math.random() - 0.5).slice(0, 4);

    return shuffled.map((area) => ({
      area: area.area,
      regency: {
        id: area.regencyId,
        name: area.regencyName,
      },
      placeCount: parseInt(area.placeCount),
      avgRating: parseFloat(area.avgRating).toFixed(2),
    }));
  }


}
