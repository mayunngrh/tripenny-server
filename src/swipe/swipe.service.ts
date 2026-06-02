import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../entities/place.entity';
import { Tag } from '../entities/tag.entity';
import { Regency } from '../entities/regency.entity';

@Injectable()
export class SwipeService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Regency)
    private regencyRepository: Repository<Regency>,
  ) {}

  async getCards(
    page: number = 1,
    limit: number = 5,
    category?: string,
    regency?: string,
    tags?: string,
  ) {
    const skip = (page - 1) * limit;

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
      ])
      .orderBy('place.rating', 'DESC');

    if (category) {
      qb.where('place.category = :category', { category });
    }

    if (regency) {
      qb.andWhere('regency.name = :regency', { regency });
    }

    if (tags) {
      const tagNames = tags.split(',').map((t) => t.trim());
      qb.andWhere('tags.name IN (:...tagNames)', { tagNames });
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    return {
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        rating: p.rating,
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
      })),
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
}
