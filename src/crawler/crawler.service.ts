import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Place } from '../entities/place.entity';

@Injectable()
export class CrawlerService {
  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
  ) {}

  async crawl(
    latitude: number,
    longitude: number,
    category: string = 'restaurant',
    radius: number = 10000,
  ) {
    try {
      console.log(`\nCrawling ${category}s near ${latitude}, ${longitude}...`);

      let allResults: any[] = [];
      let nextPageToken = null;

      do {
        const params: any = {
          location: `${latitude},${longitude}`,
          radius: radius,
          type: category,
          key: process.env.GOOGLE_MAPS_API_KEY,
        };

        if (nextPageToken) {
          params.pagetoken = nextPageToken;
        }

        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          { params },
        );

        if (
          response.data.status !== 'OK' &&
          response.data.status !== 'ZERO_RESULTS'
        ) {
          throw new Error(`Google API error: ${response.data.status}`);
        }

        allResults.push(...response.data.results);
        nextPageToken = response.data.next_page_token;

        console.log(`Page fetched: ${response.data.results.length} results`);

        if (nextPageToken) {
          console.log('Waiting for next page...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (nextPageToken);

      console.log(`\nTotal fetched: ${allResults.length} places`);

      let savedCount = 0;
      let skippedCount = 0;

      for (const place of allResults) {
        const exists = await this.placeRepository.findOne({
          where: { placeId: place.place_id },
        });

        if (!exists) {
          const photoReference = place.photos?.[0]?.photo_reference ?? undefined;
          const details = await this.fetchPlaceDetails(place.place_id);

          const newPlace = this.placeRepository.create({
            name: place.name,
            address: place.vicinity,
            category: category,
            rating: place.rating || null,
            totalRatings: place.user_ratings_total || 0,
            priceLevel: place.price_level ?? null,
            isOpenNow: place.opening_hours?.open_now ?? null,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            placeId: place.place_id,
            photoReference,
            description: details.description,
            district: details.district,
            regency: details.regency,
            province: details.province,
          });

          await this.placeRepository.save(newPlace);
          console.log(`Saved: ${place.name}`);
          savedCount++;
        } else {
          console.log(`Skipped: ${place.name} (already exists)`);
          skippedCount++;
        }
      }

      return {
        success: true,
        category,
        location: { latitude, longitude, radius },
        total: allResults.length,
        saved: savedCount,
        skipped: skippedCount,
      };
    } catch (error) {
      console.error('Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  private async fetchPlaceDetails(placeId: string): Promise<{
    description?: string;
    district?: string;
    regency?: string;
    province?: string;
  }> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'editorial_summary,address_components',
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        },
      );

      const result = response.data.result;
      const components: any[] = result?.address_components ?? [];

      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.long_name;

      return {
        description: result?.editorial_summary?.overview,
        district: get('sublocality') ?? get('sublocality_level_1'),
        regency: get('administrative_area_level_2'),
        province: get('administrative_area_level_1'),
      };
    } catch {
      return {};
    }
  }

  async getPlaceCards(page: number = 1, limit: number = 10, category?: string) {
    const skip = (page - 1) * limit;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .select([
        'place.id',
        'place.name',
        'place.rating',
        'place.totalRatings',
        'place.priceLevel',
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

  async getAllPlaces() {
    return await this.placeRepository.find({
      order: { rating: 'DESC' },
    });
  }

  async getPlacesByCategory(category: string) {
    return await this.placeRepository.find({
      where: { category },
      order: { rating: 'DESC' },
    });
  }

  async searchPlaces(query: string) {
    return await this.placeRepository
      .createQueryBuilder('place')
      .where('place.name ILIKE :query', { query: `%${query}%` })
      .orWhere('place.address ILIKE :query', { query: `%${query}%` })
      .orderBy('place.rating', 'DESC')
      .getMany();
  }

  async getPlacesByPriceLevel(priceLevel: number) {
    return await this.placeRepository.find({
      where: { priceLevel },
      order: { rating: 'DESC' },
    });
  }
}
