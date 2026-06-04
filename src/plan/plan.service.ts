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

  async createPlan(
    name: string,
    startDate: Date,
    endDate: Date,
    estimatedCost?: number,
    placeIds?: number[],
  ): Promise<any> {
    const plan = this.planRepository.create({
      name,
      startDate,
      endDate,
      estimatedCost,
    });
    const savedPlan = await this.planRepository.save(plan);

    // Add places to the plan if placeIds provided
    if (placeIds && placeIds.length > 0) {
      for (const placeId of placeIds) {
        const place = await this.placeRepository.findOne({ where: { id: placeId } });
        if (place) {
          await this.planItemRepository.save({
            plan: savedPlan,
            place,
            dayIndex: 1,
            visitTime: null,
            notes: undefined,
          });
        }
      }
    }

    const planWithItems = await this.planRepository.findOne({
      where: { id: savedPlan.id },
      relations: { items: { place: true } },
    });

    return {
      id: planWithItems!.id,
      name: planWithItems!.name,
      startDate: planWithItems!.startDate,
      endDate: planWithItems!.endDate,
      estimatedCost: planWithItems!.estimatedCost,
      items: planWithItems!.items.map((item) => ({
        id: item.id,
        dayIndex: item.dayIndex,
        visitTime: item.visitTime,
        notes: item.notes,
        place: item.place
          ? {
              id: item.place.id,
              name: item.place.name,
              rating: parseFloat(item.place.rating as any),
              price: item.place.price ?? 0,
              category: item.place.category,
            }
          : null,
      })),
      createdAt: planWithItems!.createdAt,
    };
  }

  async addItemToPlan(
    planId: number,
    placeId: number,
    dayIndex: number,
    visitTime?: string,
    notes?: string,
  ): Promise<PlanItem> {
    const place = await this.placeRepository.findOne({ where: { id: placeId } });
    const plan = await this.planRepository.findOne({ where: { id: planId } });

    const item = this.planItemRepository.create({
      plan: plan!,
      place: place || null,
      dayIndex,
      visitTime: visitTime || null,
      notes: notes || undefined,
    });
    return await this.planItemRepository.save(item);
  }

  async getPlanById(planId: number): Promise<any> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: {
        items: { place: true },
      },
    });

    if (!plan) return null;

    return {
      id: plan.id,
      name: plan.name,
      startDate: plan.startDate,
      endDate: plan.endDate,
      estimatedCost: plan.estimatedCost,
      activitiesCount: plan.items?.length || 0,
      items: plan.items.map((item) => ({
        id: item.id,
        place: item.place
          ? {
              id: item.place.id,
              name: item.place.name,
              rating: parseFloat(item.place.rating as any),
              totalRatings: item.place.totalRatings,
              priceLevel: item.place.priceLevel,
              price: item.place.price ?? 0,
              category: item.place.category,
              address: item.place.address,
              district: item.place.district,
              regency: item.place.regency,
              province: item.place.province,
              description: item.place.description,
              photoReference: item.place.photoReference,
              latitude: parseFloat(item.place.latitude as any),
              longitude: parseFloat(item.place.longitude as any),
            }
          : null,
      })),
      createdAt: plan.createdAt,
    };
  }

  async getAllPlans(): Promise<Plan[]> {
    return await this.planRepository.find({
      relations: {
        items: { place: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePlan(
    planId: number,
    name?: string,
    startDate?: Date,
    endDate?: Date,
    estimatedCost?: number,
  ): Promise<Plan | null> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) return null;

    if (name) plan.name = name;
    if (startDate) plan.startDate = startDate;
    if (endDate) plan.endDate = endDate;
    if (estimatedCost) plan.estimatedCost = estimatedCost;

    return await this.planRepository.save(plan);
  }

  async deletePlan(planId: number): Promise<boolean> {
    const result = await this.planRepository.delete(planId);
    return result.affected ? result.affected > 0 : false;
  }

  async removeItemFromPlan(itemId: number): Promise<boolean> {
    const result = await this.planItemRepository.delete(itemId);
    return result.affected ? result.affected > 0 : false;
  }

  async getActivePlans(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.items', 'items')
      .leftJoinAndSelect('items.place', 'place')
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
        estimatedCost: plan.estimatedCost,
        itemCount: plan.items?.length || 0,
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
        estimatedCost: plan.estimatedCost,
        itemCount: plan.items?.length || 0,
        thumbnailUrl,
        createdAt: plan.createdAt,
      };
    });
  }
}
