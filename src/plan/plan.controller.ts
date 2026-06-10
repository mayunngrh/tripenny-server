import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { PlanService } from './plan.service';

@ApiTags('plans')
@Controller('plans')
export class PlanController {
  constructor(private planService: PlanService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new trip plan',
    description: `Create a new trip plan with an optional list of places.

Request Body:
- name: Trip name - REQUIRED
- startDate: Trip start date (YYYY-MM-DD) - REQUIRED
- endDate: Trip end date (YYYY-MM-DD) - REQUIRED
- estimatedCost: (Optional) Estimated budget in IDR
- placeIds: (Optional) Array of place IDs to add (get IDs from /swipe/cards)`,
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Ubud & Nature Tour',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 750000,
        placeIds: [227, 402, 298],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Ubud & Nature Tour',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 750000,
        placesCount: 3,
        items: [
          {
            id: 85,
            place: {
              id: 227,
              name: 'Kecak & Fire Dance at Pura Puseh Ubud',
              rating: 4.5,
              totalRatings: 187,
              priceLevel: 2,
              price: 150000,
              bikeParkingFee: 2000,
              carParkingFee: 5000,
              category: 'kecak',
              address: 'Jl. Suweta No.32, Ubud',
              regency: { id: 2, name: 'Kabupaten Gianyar' },
              tags: [{ id: 8, name: 'culture', iconName: 'building.2' }],
              extraExpenses: [{ id: 1, name: 'Photo Printing', price: 25000, category: 'photo', icon: 'camera.fill' }],
              photoUrl: 'https://maps.googleapis.com/maps/api/place/photo?...',
              latitude: -8.5016049,
              longitude: 115.2647892,
            },
          },
        ],
        createdAt: '2026-06-10T10:00:00Z',
      },
    },
  })
  async createPlan(
    @Body('name') name: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('estimatedCost') estimatedCost?: number,
    @Body('placeIds') placeIds?: number[],
  ) {
    return await this.planService.createPlan(name, new Date(startDate), new Date(endDate), estimatedCost, placeIds);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active plans (endDate >= today)',
    description: 'Returns upcoming trip plans with thumbnail. Use for "My Plans" or "Upcoming Trips" section.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 1,
          name: 'Ubud Exploration',
          startDate: '2026-11-14',
          endDate: '2026-11-16',
          estimatedCost: 750000,
          placesCount: 3,
          thumbnailUrl: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=...',
          createdAt: '2026-06-10T10:00:00Z',
        },
      ],
    },
  })
  async getActivePlans() {
    return await this.planService.getActivePlans();
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get past plans (endDate < today)',
    description: 'Returns completed trip plans with thumbnail. Use for "Trip History" or "Memories" section.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 2,
          name: 'Seminyak Beach Holiday',
          startDate: '2026-05-10',
          endDate: '2026-05-12',
          estimatedCost: 550000,
          placesCount: 5,
          thumbnailUrl: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=...',
          createdAt: '2026-05-05T08:30:00Z',
        },
      ],
    },
  })
  async getPlanHistory() {
    return await this.planService.getPlanHistory();
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans (active + past)', description: 'Returns all plans with full place details, sorted by newest first.' })
  async getAllPlans() {
    return await this.planService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan details by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Plan with full place details',
    schema: {
      example: {
        id: 1,
        name: 'Ubud & Nature Tour',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 750000,
        placesCount: 2,
        items: [
          {
            id: 85,
            place: {
              id: 227,
              name: 'Kecak & Fire Dance at Pura Puseh Ubud',
              rating: 4.5,
              totalRatings: 187,
              priceLevel: 2,
              price: 150000,
              bikeParkingFee: 2000,
              carParkingFee: 5000,
              category: 'kecak',
              address: 'Jl. Suweta No.32, Ubud',
              regency: { id: 2, name: 'Kabupaten Gianyar' },
              tags: [{ id: 8, name: 'culture', iconName: 'building.2' }],
              extraExpenses: [{ id: 1, name: 'Photo Printing', price: 25000, category: 'photo', icon: 'camera.fill' }],
              photoUrl: 'https://maps.googleapis.com/maps/api/place/photo?...',
              latitude: -8.5016049,
              longitude: 115.2647892,
            },
          },
        ],
        createdAt: '2026-06-10T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id', ParseIntPipe) id: number) {
    const plan = await this.planService.getPlanById(id);
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);
    return plan;
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a plan',
    description: `Update plan details and/or replace the list of places.

PLAN DETAILS (all optional):
- name: Trip name
- startDate: Trip start date (YYYY-MM-DD)
- endDate: Trip end date (YYYY-MM-DD)
- estimatedCost: Budget in IDR

PLACES (optional):
- placeIds: Array of place IDs. REPLACES all current places with this new list.
  * To add a place: include all existing IDs + the new one
  * To remove a place: include all IDs except the one to remove
  * To reorder: send IDs in the new order

Examples:

Update name only:
{ "name": "New Trip Name" }

Replace all places:
{ "placeIds": [227, 402, 298, 400] }

Update both:
{ "name": "Extended Trip", "endDate": "2026-11-18", "placeIds": [227, 402, 298] }`,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Plan ID', example: 1 })
  @ApiBody({
    schema: {
      example: {
        name: 'Updated Bali Trip',
        startDate: '2026-11-14',
        endDate: '2026-11-17',
        estimatedCost: 1000000,
        placeIds: [227, 402, 298, 400],
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Plan updated, returns full plan with updated places' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name?: string,
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
    @Body('estimatedCost') estimatedCost?: number,
    @Body('placeIds') placeIds?: number[],
  ) {
    const updated = await this.planService.updatePlan(
      id,
      name,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      estimatedCost,
      placeIds,
    );
    if (!updated) throw new NotFoundException(`Plan with id ${id} not found`);
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan', description: 'Permanently deletes the entire plan and all its places.' })
  @ApiParam({ name: 'id', type: Number, description: 'Plan ID', example: 1 })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'Plan 1 deleted' } } })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    const success = await this.planService.deletePlan(id);
    if (!success) throw new NotFoundException(`Plan with id ${id} not found`);
    return { success: true, message: `Plan ${id} deleted` };
  }
}
