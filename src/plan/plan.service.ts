import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { PlanItem } from '../entities/plan-item.entity';
import { Place } from '../entities/place.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(PlanItem)
    private planItemRepository: Repository<PlanItem>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
  ) {}

  private calculateDriveTime(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    return Math.max(Math.ceil((distanceKm / 30) * 60), 1);
  }

  private calculatePlanCost(plan: Plan): number {
    let totalCost = 0;
    plan.items?.forEach((item) => {
      if (item.place) {
        totalCost += item.place.price ?? 0;
        totalCost += item.place.carParkingFee ?? 0;
        totalCost += item.place.extraExpenses?.reduce((sum, e) => sum + (e.price ?? 0), 0) ?? 0;
      }
    });
    return totalCost;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private mapPlace(place: Place, userLat?: number, userLng?: number): any {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeLat = parseFloat(place.latitude as any);
    const placeLng = parseFloat(place.longitude as any);

    const distanceMeters =
      userLat != null && userLng != null
        ? Math.round(this.calculateDistance(userLat, userLng, placeLat, placeLng))
        : null;

    return {
      id: place.id,
      name: place.name,
      rating: parseFloat(place.rating as any),
      totalRatings: place.totalRatings,
      priceLevel: place.priceLevel ?? 0,
      price: place.price ?? 0,
      bikeParkingFee: place.bikeParkingFee ?? 0,
      carParkingFee: place.carParkingFee ?? 0,
      category: place.category ?? '',
      address: place.address ?? '',
      district: place.district ?? '',
      regency: place.regency,
      province: place.province ?? '',
      description: place.description ?? '',
      tags: place.tags,
      extraExpenses: place.extraExpenses.map((e) => ({
        id: e.id,
        name: e.name,
        price: e.price,
        category: e.category,
        icon: e.icon,
      })),
      photoUrl: place.photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photoReference}&key=${apiKey}`
        : null,
      latitude: placeLat,
      longitude: placeLng,
      ...(distanceMeters != null && {
        distance: distanceMeters,
        driveTimeMinutes: this.calculateDriveTime(distanceMeters),
      }),
    };
  }

  private mapPlan(plan: Plan, userLat?: number, userLng?: number): any {
    return {
      id: plan.id,
      name: plan.name,
      startDate: plan.startDate,
      endDate: plan.endDate,
      estimatedCost: plan.estimatedCost,
      placesCount: plan.items?.length || 0,
      items: plan.items.map((item) => ({
        id: item.id,
        place: item.place ? this.mapPlace(item.place, userLat, userLng) : null,
      })),
      createdAt: plan.createdAt,
    };
  }

  private async loadPlan(planId: number): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { id: planId },
      relations: { items: { place: { extraExpenses: true, tags: true, regency: true } } },
    });
  }

  private async replacePlaces(plan: Plan, placeIds: number[]): Promise<void> {
    await this.planItemRepository.delete({ plan: { id: plan.id } });
    for (const placeId of placeIds) {
      const place = await this.placeRepository.findOne({ where: { id: placeId } });
      if (place) {
        await this.planItemRepository.save({ plan, place, dayIndex: 1 });
      }
    }
  }

  async createPlan(
    name: string,
    startDate: Date,
    endDate: Date,
    estimatedCost?: number,
    placeIds?: number[],
  ): Promise<any> {
    const plan = await this.planRepository.save(
      this.planRepository.create({ name, startDate, endDate, estimatedCost }),
    );

    if (placeIds && placeIds.length > 0) {
      await this.replacePlaces(plan, placeIds);
    }

    return this.mapPlan((await this.loadPlan(plan.id))!);
  }

  async getPlanById(planId: number, userLat?: number, userLng?: number): Promise<any> {
    const plan = await this.loadPlan(planId);
    if (!plan) return null;
    return this.mapPlan(plan, userLat, userLng);
  }

  async getAllPlans(): Promise<any[]> {
    const plans = await this.planRepository.find({
      relations: { items: { place: { extraExpenses: true, tags: true, regency: true } } },
      order: { createdAt: 'DESC' },
    });
    return plans.map((plan) => this.mapPlan(plan));
  }

  async updatePlan(
    planId: number,
    name?: string,
    startDate?: Date,
    endDate?: Date,
    estimatedCost?: number,
    placeIds?: number[],
  ): Promise<any | null> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: { items: true },
    });
    if (!plan) return null;

    if (name) plan.name = name;
    if (startDate) plan.startDate = startDate;
    if (endDate) plan.endDate = endDate;
    if (estimatedCost !== undefined) plan.estimatedCost = estimatedCost;
    await this.planRepository.save(plan);

    if (placeIds !== undefined) {
      await this.replacePlaces(plan, placeIds);
    }

    return this.mapPlan((await this.loadPlan(planId))!);
  }

  async deletePlan(planId: number): Promise<boolean> {
    const result = await this.planRepository.delete(planId);
    return result.affected ? result.affected > 0 : false;
  }

  async getActivePlans(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.items', 'items')
      .leftJoinAndSelect('items.place', 'place')
      .leftJoinAndSelect('place.extraExpenses', 'extraExpenses')
      .where('plan.endDate >= :today', { today })
      .orderBy('plan.startDate', 'ASC')
      .addOrderBy('plan.createdAt', 'DESC')
      .getMany();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    return plans.map((plan) => {
      const firstPlace = plan.items?.[0]?.place;
      const thumbnailUrl = firstPlace?.photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${firstPlace.photoReference}&key=${apiKey}`
        : null;

      return {
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        endDate: plan.endDate,
        estimatedCost: this.calculatePlanCost(plan),
        placesCount: plan.items?.length || 0,
        thumbnailUrl,
        createdAt: plan.createdAt,
      };
    });
  }

  async getPlanHistory(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.items', 'items')
      .leftJoinAndSelect('items.place', 'place')
      .leftJoinAndSelect('place.extraExpenses', 'extraExpenses')
      .where('plan.endDate < :today', { today })
      .orderBy('plan.endDate', 'DESC')
      .addOrderBy('plan.createdAt', 'DESC')
      .getMany();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    return plans.map((plan) => {
      const firstPlace = plan.items?.[0]?.place;
      const thumbnailUrl = firstPlace?.photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${firstPlace.photoReference}&key=${apiKey}`
        : null;

      return {
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        endDate: plan.endDate,
        estimatedCost: this.calculatePlanCost(plan),
        placesCount: plan.items?.length || 0,
        thumbnailUrl,
        createdAt: plan.createdAt,
      };
    });
  }
}
