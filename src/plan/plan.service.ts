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
  ): Promise<Plan> {
    const plan = this.planRepository.create({
      name,
      startDate,
      endDate,
      estimatedCost,
      items: [],
    });
    return await this.planRepository.save(plan);
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

  async getPlanById(planId: number): Promise<Plan | null> {
    return await this.planRepository.findOne({
      where: { id: planId },
      relations: {
        items: { place: true },
      },
    });
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
