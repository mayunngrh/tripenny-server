import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../entities/place.entity';

@Injectable()
export class SwipeService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
  ) {}

  async getCards(page: number = 1, limit: number = 5, category?: string) {
    const skip = (page - 1) * limit;

    const qb = this.placeRepository
      .createQueryBuilder('place')
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
      ])
      .orderBy('place.rating', 'DESC')
      .skip(skip)
      .take(limit);

    if (category) {
      qb.where('place.category = :category', { category });
    }

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
        regency: p.regency,
        province: p.province,
        description: p.description,
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
}
