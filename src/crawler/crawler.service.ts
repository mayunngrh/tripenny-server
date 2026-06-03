import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Place } from '../entities/place.entity';
import { Tag } from '../entities/tag.entity';
import { Regency } from '../entities/regency.entity';

@Injectable()
export class CrawlerService {
  private tagMap: Record<string, string[]> = {
    tourist_attraction: ['sightseeing', 'outdoor'],
    zoo: ['wildlife', 'family-friendly', 'zoo'],
    aquarium: ['aquarium', 'family-friendly', 'wildlife'],
    park: ['outdoor', 'nature', 'family-friendly'],
    museum: ['culture', 'education', 'history'],
    hindu_temple: ['culture', 'sightseeing', 'landmark'],
    natural_feature: ['nature', 'outdoor', 'beachfront'],
    amusement_park: ['amusement-park', 'entertainment', 'family-friendly'],
    water_park: ['water-park', 'entertainment', 'family-friendly'],
    art_gallery: ['art', 'culture'],
    restaurant: ['dining'],
    hotel: ['accommodation'],
    cafe: ['dining'],
    // keyword-based crawls
    trekking: ['trekking', 'outdoor', 'nature'],
    surfing: ['surfing', 'outdoor'],
    snorkeling: ['snorkeling', 'outdoor'],
    'scuba diving': ['scuba-diving', 'outdoor'],
    'river rafting': ['river-rafting', 'outdoor', 'trekking'],
    tubing: ['tubing', 'outdoor'],
    'jet ski': ['jet-skiing', 'outdoor'],
    'traditional dance': ['traditional-performance', 'culture'],
    'rice terrace': ['agriculture', 'nature', 'sightseeing'],
    landmark: ['landmark', 'sightseeing', 'culture'],
    'history museum': ['history', 'culture', 'education'],
  };

  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Regency)
    private regencyRepository: Repository<Regency>,
  ) {}

  private async createOrGetTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];
    for (const name of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name } });
      if (!tag) {
        tag = await this.tagRepository.save({ name });
      }
      tags.push(tag);
    }
    return tags;
  }

  private async createOrGetRegency(regencyName?: string): Promise<Regency | null> {
    if (!regencyName) return null;
    let regency = await this.regencyRepository.findOne({ where: { name: regencyName } });
    if (!regency) {
      regency = await this.regencyRepository.save({ name: regencyName });
    }
    return regency;
  }

  async crawl(
    latitude: number,
    longitude: number,
    category?: string,
    keyword?: string,
    radius: number = 10000,
    limit?: number,
  ) {
    try {
      const searchType = category ? `${category}s` : `"${keyword}"`;
      console.log(`\nCrawling ${searchType} near ${latitude}, ${longitude}...`);

      let allResults: any[] = [];
      let nextPageToken = null;

      do {
        const params: any = {
          location: `${latitude},${longitude}`,
          radius: radius,
          key: process.env.GOOGLE_MAPS_API_KEY,
        };

        if (category) {
          params.type = category;
        } else if (keyword) {
          params.keyword = keyword;
        }

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

        if (limit && allResults.length >= limit) {
          nextPageToken = null;
        } else if (nextPageToken) {
          console.log('Waiting for next page...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (nextPageToken);

      if (limit && allResults.length > limit) {
        allResults = allResults.slice(0, limit);
      }

      console.log(`\nTotal fetched: ${allResults.length} places`);

      let savedCount = 0;
      let skippedCount = 0;
      let filteredCount = 0;

      for (const place of allResults) {
        const rating = place.rating || 0;
        const totalRatings = place.user_ratings_total || 0;

        const minReviews = keyword ? 0 : 100;
        if (totalRatings < minReviews || rating < 3.0) {
          console.log(`Filtered: ${place.name} (rating: ${rating}, reviews: ${totalRatings})`);
          filteredCount++;
          continue;
        }

        const exists = await this.placeRepository.findOne({
          where: { placeId: place.place_id },
        });

        if (!exists) {
          const photoReference = place.photos?.[0]?.photo_reference ?? undefined;
          const details = await this.fetchPlaceDetails(place.place_id);

          const tagKey = (category ?? keyword ?? '').toLowerCase().replace(/\s+bali$/, '').trim();
          const tagNames =
            this.tagMap[tagKey] ??
            Object.entries(this.tagMap).find(([k]) => tagKey.includes(k))?.[1] ??
            ['sightseeing'];
          const tags = await this.createOrGetTags(tagNames);
          const regency = await this.createOrGetRegency(details.regency);

          const resolvedPriceLevel = place.price_level ?? details.priceLevel ?? undefined;
          const estimatedPrice = this.estimatePriceFromLevel(resolvedPriceLevel) ?? undefined;

          const newPlace = this.placeRepository.create({
            name: place.name,
            address: place.vicinity,
            category: category || keyword,
            rating: place.rating || null,
            totalRatings: place.user_ratings_total || 0,
            priceLevel: resolvedPriceLevel,
            price: estimatedPrice,
            isOpenNow: place.opening_hours?.open_now ?? null,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            placeId: place.place_id,
            photoReference: details.photoReference ?? photoReference,
            description: details.description,
            district: details.district,
            regency,
            province: details.province,
            tags,
          });

          await this.placeRepository.save(newPlace);
          console.log(`Saved: ${place.name}`);
          savedCount++;
        } else {
          console.log(`Skipped: ${place.name} (already exists)`);
          skippedCount++;
        }
      }

      const filterDesc = keyword
        ? 'rating >= 3.0'
        : 'rating >= 3.0 AND totalRatings >= 100';

      return {
        success: true,
        category: category || keyword,
        location: { latitude, longitude, radius },
        total: allResults.length,
        saved: savedCount,
        skipped: skippedCount,
        filtered: filteredCount,
        quality_filter: filterDesc,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private estimatePriceFromLevel(priceLevel: number | undefined): number | undefined {
    const map: Record<number, number> = {
      0: 0,
      1: 50000,
      2: 150000,
      3: 350000,
      4: 600000,
    };
    return priceLevel != null ? (map[priceLevel] ?? undefined) : undefined;
  }

  private async fetchPlaceDetails(placeId: string): Promise<{
    description?: string;
    district?: string;
    regency?: string;
    province?: string;
    photoReference?: string;
    priceLevel?: number;
  }> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'editorial_summary,address_components,photos,price_level',
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        },
      );

      const result = response.data.result;
      const components: any[] = result?.address_components ?? [];

      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.long_name;

      let regency = get('administrative_area_level_2');
      const province = get('administrative_area_level_1');

      if (regency === province) {
        regency = undefined;
      }

      const photoReference = result?.photos?.[0]?.photo_reference ?? undefined;

      return {
        description: result?.editorial_summary?.overview,
        district: get('sublocality') ?? get('sublocality_level_1'),
        regency,
        province,
        photoReference,
        priceLevel: result?.price_level ?? undefined,
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
    const places = await this.placeRepository.find({
      order: { rating: 'DESC' },
    });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    return places.map((p) => ({
      ...p,
      photoUrl: p.photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photoReference}&key=${apiKey}`
        : null,
    }));
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

  async getPlacesByTag(tagName: string) {
    return await this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.tags', 'tag')
      .where('tag.name = :tagName', { tagName })
      .orderBy('place.rating', 'DESC')
      .getMany();
  }

  async bulkCrawl() {
    const BALI_CENTER = { lat: -8.4095, lng: 115.1889 };
    const SOUTH_BALI = { lat: -8.7211, lng: 115.1691 };
    const EAST_BALI = { lat: -8.5069, lng: 115.2625 };

    const jobs: { lat: number; lng: number; category?: string; keyword?: string; radius: number; limit: number }[] = [
      { ...BALI_CENTER, category: 'art_gallery',       radius: 50000, limit: 5 },
      { ...BALI_CENTER, category: 'aquarium',           radius: 50000, limit: 3 },
      { ...BALI_CENTER, category: 'amusement_park',    radius: 50000, limit: 3 },
      { ...BALI_CENTER, category: 'water_park',         radius: 50000, limit: 3 },
      { ...BALI_CENTER, keyword: 'history museum bali', radius: 50000, limit: 5 },
      { ...BALI_CENTER, keyword: 'landmark bali',       radius: 50000, limit: 5 },
      { ...BALI_CENTER, keyword: 'traditional dance bali', radius: 50000, limit: 5 },
      { ...BALI_CENTER, keyword: 'rice terrace bali',   radius: 50000, limit: 5 },
      { ...BALI_CENTER, keyword: 'trekking bali',       radius: 50000, limit: 5 },
      { ...BALI_CENTER, keyword: 'river rafting bali',  radius: 50000, limit: 5 },
      { ...SOUTH_BALI,  keyword: 'surfing bali',        radius: 20000, limit: 5 },
      { ...SOUTH_BALI,  keyword: 'jet ski bali',        radius: 20000, limit: 3 },
      { ...EAST_BALI,   keyword: 'snorkeling bali',     radius: 30000, limit: 5 },
      { ...EAST_BALI,   keyword: 'scuba diving bali',   radius: 30000, limit: 5 },
      { ...EAST_BALI,   keyword: 'tubing bali',         radius: 50000, limit: 3 },
    ];

    await this.seedTags();

    const summary: any[] = [];
    for (const job of jobs) {
      const result = await this.crawl(job.lat, job.lng, job.category, job.keyword, job.radius, job.limit);
      summary.push({ job: job.category ?? job.keyword, ...result });
      await new Promise((r) => setTimeout(r, 1000));
    }

    const totalSaved = summary.reduce((acc, r) => acc + (r.saved ?? 0), 0);
    const totalSkipped = summary.reduce((acc, r) => acc + (r.skipped ?? 0), 0);

    return { success: true, totalSaved, totalSkipped, details: summary };
  }

  async seedTags() {
    const tagsToSeed = [
      { name: 'art', iconName: 'photo.artframe' },
      { name: 'history', iconName: 'clock.arrow.circlepath' },
      { name: 'landmark', iconName: 'building.columns' },
      { name: 'zoo', iconName: 'hare' },
      { name: 'aquarium', iconName: 'fish' },
      { name: 'water-park', iconName: 'figure.pool.swim' },
      { name: 'amusement-park', iconName: 'ferriswheel' },
      { name: 'trekking', iconName: 'figure.hiking' },
      { name: 'traditional-performance', iconName: 'theatermasks' },
      { name: 'agriculture', iconName: 'leaf.circle' },
      { name: 'surfing', iconName: 'figure.surfing' },
      { name: 'jet-skiing', iconName: 'water.waves' },
      { name: 'snorkeling', iconName: 'figure.open.water.swim' },
      { name: 'scuba-diving', iconName: 'lungs' },
      { name: 'river-rafting', iconName: 'arrowshape.bounce.forward' },
      { name: 'tubing', iconName: 'circle.circle' },
    ];

    const results: { name: string; status: 'created' | 'exists' }[] = [];

    for (const t of tagsToSeed) {
      let tag = await this.tagRepository.findOne({ where: { name: t.name } });
      if (!tag) {
        await this.tagRepository.save(t);
        results.push({ name: t.name, status: 'created' });
      } else {
        if (!tag.iconName) {
          tag.iconName = t.iconName;
          await this.tagRepository.save(tag);
        }
        results.push({ name: t.name, status: 'exists' });
      }
    }

    return { success: true, tags: results };
  }

  async updateAllPhotoReferences() {
    try {
      const places = await this.placeRepository.find();
      console.log(`\nUpdating photoReferences for ${places.length} places...`);

      let updatedCount = 0;
      let skippedCount = 0;

      for (const place of places) {
        try {
          const details = await this.fetchPlaceDetails(place.placeId);
          if (details.photoReference) {
            place.photoReference = details.photoReference;
            await this.placeRepository.save(place);
            updatedCount++;
            console.log(`✓ Updated: ${place.name}`);
          } else {
            skippedCount++;
            console.log(`⊘ No photo: ${place.name}`);
          }
        } catch (error) {
          skippedCount++;
          console.log(`✗ Error updating ${place.name}: ${error.message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return {
        success: true,
        total: places.length,
        updated: updatedCount,
        skipped: skippedCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
