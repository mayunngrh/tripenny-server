# Plan API Documentation

## Overview

The Plan API allows users to create, view, and manage trip plans. A plan consists of:
- **Trip metadata**: name, start/end dates, estimated budget
- **Places**: a flat list of places to visit (full details included)

## Quick Start Workflow

1. `POST /plans` — create a new plan with initial places
2. `GET /plans/:id` — view plan details
3. `PUT /plans/:id` — update plan details and/or replace the places list
4. `DELETE /plans/:id` — delete the entire plan

---

## Endpoints

### POST `/plans` — Create a New Plan

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Trip name |
| `startDate` | string | Yes | ISO format: YYYY-MM-DD |
| `endDate` | string | Yes | ISO format: YYYY-MM-DD |
| `estimatedCost` | number | No | Budget in IDR |
| `placeIds` | number[] | No | Place IDs to add (from `/swipe/cards`) |

```json
{
  "name": "Ubud & Nature Tour",
  "startDate": "2026-11-14",
  "endDate": "2026-11-16",
  "estimatedCost": 750000,
  "placeIds": [227, 402, 298]
}
```

#### Response

```json
{
  "id": 1,
  "name": "Ubud & Nature Tour",
  "startDate": "2026-11-14",
  "endDate": "2026-11-16",
  "estimatedCost": 750000,
  "placesCount": 3,
  "items": [
    {
      "id": 85,
      "place": {
        "id": 227,
        "name": "Kecak & Fire Dance at Pura Puseh Ubud",
        "rating": 4.5,
        "totalRatings": 187,
        "priceLevel": 2,
        "price": 150000,
        "bikeParkingFee": 2000,
        "carParkingFee": 5000,
        "category": "kecak",
        "address": "Jl. Suweta No.32, Ubud",
        "district": null,
        "regency": { "id": 2, "name": "Kabupaten Gianyar" },
        "province": "Bali",
        "description": null,
        "tags": [
          { "id": 8, "name": "culture", "iconName": "building.2" }
        ],
        "extraExpenses": [
          { "id": 1, "name": "Photo Printing", "price": 25000, "category": "photo", "icon": "camera.fill" }
        ],
        "photoUrl": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=...",
        "latitude": -8.5016049,
        "longitude": 115.2647892
      }
    }
  ],
  "createdAt": "2026-06-10T10:00:00Z"
}
```

---

### GET `/plans/:id` — View Plan Details

Returns a single plan with full place details.

```bash
GET /plans/1
```

#### Response

```json
{
  "id": 1,
  "name": "Ubud & Nature Tour",
  "startDate": "2026-11-14",
  "endDate": "2026-11-16",
  "estimatedCost": 750000,
  "placesCount": 2,
  "items": [
    {
      "id": 85,
      "place": {
        "id": 227,
        "name": "Kecak & Fire Dance at Pura Puseh Ubud",
        "rating": 4.5,
        "totalRatings": 187,
        "priceLevel": 2,
        "price": 150000,
        "bikeParkingFee": 2000,
        "carParkingFee": 5000,
        "category": "kecak",
        "address": "Jl. Suweta No.32, Ubud",
        "district": null,
        "regency": { "id": 2, "name": "Kabupaten Gianyar" },
        "province": "Bali",
        "description": null,
        "tags": [
          { "id": 8, "name": "culture", "iconName": "building.2" }
        ],
        "extraExpenses": [
          { "id": 1, "name": "Photo Printing", "price": 25000, "category": "photo", "icon": "camera.fill" }
        ],
        "photoUrl": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=...",
        "latitude": -8.5016049,
        "longitude": 115.2647892
      }
    }
  ],
  "createdAt": "2026-06-10T10:00:00Z"
}
```

---

### GET `/plans` — Get All Plans

Returns all plans with full place details, sorted newest first. Each plan uses the same `items` format as `GET /plans/:id`.

---

### GET `/plans/active` — Get Active Plans

Returns plans where `endDate >= today`. Use for "My Plans" / "Upcoming Trips".

#### Response

```json
[
  {
    "id": 1,
    "name": "Ubud & Nature Tour",
    "startDate": "2026-11-14",
    "endDate": "2026-11-16",
    "estimatedCost": 750000,
    "placesCount": 3,
    "thumbnailUrl": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=...",
    "createdAt": "2026-06-10T10:00:00Z"
  }
]
```

---

### GET `/plans/history` — Get Past Plans

Returns plans where `endDate < today`. Use for "Trip History" / "Memories".

Same response format as `/plans/active`.

---

### PUT `/plans/:id` — Update Plan

Updates plan details and/or replaces the places list. All fields are optional.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Trip name |
| `startDate` | string | No | ISO format: YYYY-MM-DD |
| `endDate` | string | No | ISO format: YYYY-MM-DD |
| `estimatedCost` | number | No | Budget in IDR |
| `placeIds` | number[] | No | **Replaces** the full places list |

> **Important**: `placeIds` in PUT **replaces all current places** with the new list.
> - To **add** a place: send current IDs + the new one
> - To **remove** a place: send all IDs except the one to remove
> - To **reorder**: send IDs in the desired order

**Option A — Update plan details only:**
```json
{
  "name": "Extended Bali Trip",
  "endDate": "2026-11-18",
  "estimatedCost": 1000000
}
```

**Option B — Replace places only:**
```json
{
  "placeIds": [227, 402, 298, 400]
}
```

**Option C — Update both:**
```json
{
  "name": "Extended Bali Trip",
  "endDate": "2026-11-18",
  "estimatedCost": 1000000,
  "placeIds": [227, 402, 298, 400]
}
```

#### Response

Returns the full updated plan (same `items` format as `GET /plans/:id`).

---

### DELETE `/plans/:id` — Delete Plan

Permanently deletes the entire plan and all its places.

#### Response

```json
{
  "success": true,
  "message": "Plan 1 deleted"
}
```

> ⚠️ This action cannot be undone.

---

## Complete Workflow Example

### Step 1: Create plan with initial places
```bash
curl -X POST http://localhost:3000/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bali Trip",
    "startDate": "2026-11-14",
    "endDate": "2026-11-16",
    "placeIds": [227, 402]
  }'
```
Result: plan with 2 places (`placesCount: 2`)

### Step 2: Add one more place (send all current IDs + the new one)
```bash
curl -X PUT http://localhost:3000/plans/1 \
  -H "Content-Type: application/json" \
  -d '{ "placeIds": [227, 402, 298] }'
```
Result: plan now has 3 places (`placesCount: 3`)

### Step 3: Remove a place (send all IDs except the one to remove)
```bash
curl -X PUT http://localhost:3000/plans/1 \
  -H "Content-Type: application/json" \
  -d '{ "placeIds": [227, 298] }'
```
Result: place 402 removed, plan now has 2 places

### Step 4: Update name and budget
```bash
curl -X PUT http://localhost:3000/plans/1 \
  -H "Content-Type: application/json" \
  -d '{ "name": "Updated Trip", "estimatedCost": 1500000 }'
```
Result: plan details updated, places unchanged

### Step 5: View final plan
```bash
curl http://localhost:3000/plans/1
```

### Step 6: Delete plan
```bash
curl -X DELETE http://localhost:3000/plans/1
```

---

## Place Details in Response

Each place in `places` array includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Place ID |
| `name` | string | Place name |
| `rating` | number | Google rating (0-5) |
| `totalRatings` | number | Number of ratings |
| `priceLevel` | number | Price level (0-4) |
| `price` | number | Entrance fee in IDR |
| `bikeParkingFee` | number | Motorcycle parking in IDR |
| `carParkingFee` | number | Car parking in IDR |
| `category` | string | Place category |
| `address` | string | Full address |
| `regency` | object | `{id, name}` |
| `province` | string | Province name |
| `description` | string | Place description |
| `tags` | array | `[{id, name, iconName}]` |
| `extraExpenses` | array | `[{id, name, price, category, icon}]` |
| `photoUrl` | string | Google Places photo URL |
| `latitude` | number | Latitude coordinate |
| `longitude` | number | Longitude coordinate |

### Total Cost Calculation

```
By motorcycle: price + bikeParkingFee + sum(extraExpenses[].price)
By car:        price + carParkingFee  + sum(extraExpenses[].price)
```

**Example:**
```
price:          150,000 IDR
bikeParkingFee:   2,000 IDR
carParkingFee:    5,000 IDR
extraExpenses:   25,000 IDR (Photo Printing)

By motorcycle: 150,000 + 2,000 + 25,000 = 177,000 IDR
By car:        150,000 + 5,000 + 25,000 = 180,000 IDR
```

---

## Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/plans` | Create new plan |
| GET | `/plans` | Get all plans |
| GET | `/plans/active` | Get upcoming plans |
| GET | `/plans/history` | Get past plans |
| GET | `/plans/:id` | Get plan details |
| PUT | `/plans/:id` | Update plan / replace places |
| DELETE | `/plans/:id` | Delete plan |

---

## Error Responses

| Status | Message |
|--------|---------|
| 404 | `Plan with id {id} not found` |
| 404 | `Plan {id} or place {id} not found` |
| 500 | `Internal server error` |

---

## Changelog

### v2.0.0 - Latest
- Simplified response: `places` flat array instead of `items` wrapper objects
- Removed `dayIndex`, `visitTime`, `notes` from plan structure
- `PUT /plans/:id` now accepts `placeIds` to replace all places
- `POST /plans/:id/items` simplified to just `placeId`
- Renamed `activitiesCount` → `placesCount`, `itemCount` → `placesCount`

### v1.0.0
- Initial plan API with items, dayIndex, visitTime, notes
