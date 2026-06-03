import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { PlanService } from './plan.service';

/**
 * PLAN API - Trip Planning System
 *
 * Create, manage, and customize your Bali trip plans. A plan consists of:
 * - Trip name and dates (start date, end date)
 * - Estimated budget/cost
 * - Multiple items (places to visit) organized by day
 *
 * Workflow:
 * 1. POST /plans - Create a new trip plan
 * 2. GET /plans - View all your plans
 * 3. GET /plans/:id - View specific plan details
 * 4. POST /plans/:id/items - Add places to your plan
 * 5. PUT /plans/:id - Update plan details
 * 6. DELETE /plans/:id/items/:itemId - Remove place from plan
 * 7. DELETE /plans/:id - Delete entire plan
 *
 * Each plan item includes:
 * - Place (auto-linked with rating, price, category, coordinates)
 * - Day index (which day of the trip, 1-indexed)
 * - Visit time (optional, 24-hour format)
 * - Notes (optional, any custom notes for this visit)
 */

@ApiTags('plans')
@Controller('plans')
export class PlanController {
  constructor(private planService: PlanService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new trip plan',
    description: `Create a new trip plan. This is the first step in planning your Bali adventure.

Request Body:
- name: Trip name (e.g., "Ubud Exploration", "Bali Beach Holiday")
- startDate: Trip start date (ISO format: YYYY-MM-DD)
- endDate: Trip end date (ISO format: YYYY-MM-DD)
- estimatedCost: (Optional) Estimated total budget in IDR

Returns: Created plan object with empty items array`,
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Ubud Exploration',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 466250,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Ubud Exploration',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 466250,
        items: [],
        createdAt: '2026-06-03T10:00:00Z',
      },
    },
  })
  async createPlan(
    @Body('name') name: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('estimatedCost') estimatedCost?: number,
  ) {
    return await this.planService.createPlan(
      name,
      new Date(startDate),
      new Date(endDate),
      estimatedCost,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all my plans',
    description: `Retrieve all trip plans with complete details including all items and associated place information.

Returns: Array of plan objects sorted by creation date (newest first). Each plan includes:
- Basic info: id, name, startDate, endDate, estimatedCost
- items: Array of places organized by day with timing and notes
- createdAt: Plan creation timestamp`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all plans',
    schema: {
      example: [
        {
          id: 1,
          name: 'Ubud Exploration',
          startDate: '2026-11-14',
          endDate: '2026-11-16',
          estimatedCost: 466250,
          items: [
            {
              id: 1,
              dayIndex: 1,
              visitTime: '09:00:00',
              notes: 'Morning visit',
              place: {
                id: 281,
                name: 'Pura Tirta Empul',
                rating: 4.6,
                price: 50000,
                category: 'tourist_attraction',
                coordinates: { lat: -8.5048, lng: 115.2626 },
              },
            },
          ],
          createdAt: '2026-06-03T10:00:00Z',
        },
      ],
    },
  })
  async getAllPlans() {
    return await this.planService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific plan by ID',
    description: `Retrieve a single plan with all its details and associated places.

This endpoint is useful when you want to view the complete itinerary for a specific trip,
including all places, visit times, notes, and place details (ratings, prices, coordinates).`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Plan ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan details with all items and place information',
    schema: {
      example: {
        id: 1,
        name: 'Ubud Exploration',
        startDate: '2026-11-14',
        endDate: '2026-11-16',
        estimatedCost: 466250,
        items: [
          {
            id: 1,
            dayIndex: 1,
            visitTime: '09:00:00',
            notes: 'Sunrise visit',
            place: {
              id: 281,
              name: 'Pura Tirta Empul',
              rating: 4.6,
              price: 50000,
              category: 'tourist_attraction',
            },
          },
        ],
        createdAt: '2026-06-03T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getPlanById(@Param('id', ParseIntPipe) id: number) {
    const plan = await this.planService.getPlanById(id);
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);
    return plan;
  }

  @Post(':id/items')
  @ApiOperation({
    summary: 'Add a place to a plan',
    description: `Add a place (destination) to your trip plan. Organize multiple places by day and time.

Request Body:
- placeId: ID of the place to add (get from /swipe/cards)
- dayIndex: Which day of the trip (1 = first day, 2 = second day, etc.)
- visitTime: (Optional) Preferred visit time in HH:MM format (24-hour)
- notes: (Optional) Custom notes for this visit (e.g., "Bring swimwear", "Book guide ahead")

Example: If your trip is Nov 14-16 (3 days):
- Day 1 = Nov 14, Day 2 = Nov 15, Day 3 = Nov 16

You can add multiple places to the same day.`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Plan ID',
    example: 1,
  })
  @ApiBody({
    schema: {
      example: {
        placeId: 281,
        dayIndex: 1,
        visitTime: '09:00',
        notes: 'Morning visit with guide',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Place successfully added to plan',
    schema: {
      example: {
        id: 1,
        dayIndex: 1,
        visitTime: '09:00:00',
        notes: 'Morning visit with guide',
        place: {
          id: 281,
          name: 'Pura Tirta Empul',
          rating: 4.6,
          price: 50000,
          category: 'tourist_attraction',
        },
      },
    },
  })
  async addItemToPlan(
    @Param('id', ParseIntPipe) planId: number,
    @Body('placeId', ParseIntPipe) placeId: number,
    @Body('dayIndex', ParseIntPipe) dayIndex: number,
    @Body('visitTime') visitTime?: string,
    @Body('notes') notes?: string,
  ) {
    return await this.planService.addItemToPlan(planId, placeId, dayIndex, visitTime, notes);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a plan',
    description: `Update trip plan details. You can change:
- Trip name (e.g., if you want to rename it)
- Start/end dates (if you're extending or shortening your trip)
- Estimated cost (when you have a better budget estimate)

All fields are optional - only send the fields you want to update.`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Plan ID',
    example: 1,
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Ubud & Seminyak Exploration',
        startDate: '2026-11-14',
        endDate: '2026-11-17',
        estimatedCost: 500000,
      },
    },
  })
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name?: string,
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
    @Body('estimatedCost') estimatedCost?: number,
  ) {
    const updated = await this.planService.updatePlan(
      id,
      name,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      estimatedCost,
    );
    if (!updated) throw new NotFoundException(`Plan with id ${id} not found`);
    return updated;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a plan',
    description: `Delete an entire trip plan and all its associated places/items.

⚠️ WARNING: This action is permanent and cannot be undone. All places and notes in this plan will be deleted.`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Plan ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Plan 1 deleted',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    const success = await this.planService.deletePlan(id);
    if (!success) throw new NotFoundException(`Plan with id ${id} not found`);
    return { success: true, message: `Plan ${id} deleted` };
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({
    summary: 'Remove a place from a plan',
    description: `Remove a specific place (item) from your trip plan.

You can use this to delete individual places you added without affecting the rest of your plan.
To remove a place, you need its itemId (returned when you added it or visible in the plan details).`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Plan ID',
    example: 1,
  })
  @ApiParam({
    name: 'itemId',
    type: Number,
    description: 'Plan Item ID (returned when place was added)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Place removed from plan successfully',
    schema: {
      example: {
        success: true,
        message: 'Item 1 removed from plan 1',
      },
    },
  })
  async removeItemFromPlan(
    @Param('id', ParseIntPipe) planId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    const success = await this.planService.removeItemFromPlan(itemId);
    if (!success) throw new NotFoundException(`Item ${itemId} not found in plan ${planId}`);
    return { success: true, message: `Item ${itemId} removed from plan ${planId}` };
  }
}
