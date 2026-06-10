# Tripenny API Documentation

Complete API reference for the Tripenny backend. Two main API modules:

## 📍 Swipe API - Place Discovery

Discover and filter travel places in Bali with ratings, pricing, location, and photos.

**Use this API to:**
- Find places by location (distance-based search)
- Filter by regency, category, budget, tags
- Get complete place details with all pricing information
- Browse tags and regencies

**Read**: [SWIPE_API_DOCS.md](./SWIPE_API_DOCS.md)

**Quick endpoints:**
- `GET /swipe/cards` - Search places by location and filters
- `GET /swipe/tags` - Get all available tags
- `GET /swipe/regencies` - Get all regencies
- `GET /swipe/budgets` - Get budget tiers

---

## 📅 Plan API - Trip Planning

Create and manage trip plans with multiple places, organized by day.

**Use this API to:**
- Create trip plans with a list of places
- Add or remove places from a plan
- Update plan details and dates
- View plan history and upcoming trips

**Read**: [PLAN_API_DOCS.md](./PLAN_API_DOCS.md)

**Quick endpoints:**
- `POST /plans` - Create new plan with `placeIds`
- `GET /plans/:id` - View plan with full place details
- `GET /plans/active` - View upcoming trips
- `GET /plans/history` - View past trips
- `PUT /plans/:id` - Update plan details and/or replace `placeIds`
- `DELETE /plans/:id` - Delete plan

---

## Data Structure Overview

### Place Object

Every place includes:

```json
{
  "id": 227,
  "name": "Kecak & Fire Dance at Pura Puseh Ubud",
  "rating": 4.5,
  "totalRatings": 187,
  "priceLevel": 2,
  "price": 150000,
  "bikeParkingFee": 2000,
  "carParkingFee": 5000,
  "category": "kecak",
  "address": "Jl. Suweta No.32, Ubud, Kabupaten Gianyar",
  "district": null,
  "regency": {
    "id": 2,
    "name": "Kabupaten Gianyar"
  },
  "province": "Bali",
  "description": "Traditional Balinese fire dance performance",
  "tags": [
    {
      "id": 8,
      "name": "culture",
      "iconName": "building.2"
    }
  ],
  "extraExpenses": [
    {
      "id": 1,
      "name": "Photo Printing",
      "price": 25000,
      "category": "photo",
      "icon": "camera.fill"
    }
  ],
  "photoUrl": "https://maps.googleapis.com/maps/api/place/photo?...",
  "coordinates": {
    "lat": -8.5016049,
    "lng": 115.2647892
  },
  "distance": 5000,
  "driveTimeMinutes": 10
}
```

### Plan Object

```json
{
  "id": 1,
  "name": "Ubud & Nature Tour",
  "startDate": "2026-11-14",
  "endDate": "2026-11-16",
  "estimatedCost": 750000,
  "placesCount": 3,
  "items": [
    { "id": 85, "place": { ... full place object ... } },
    { "id": 86, "place": { ... full place object ... } }
  ],
  "createdAt": "2026-06-10T10:00:00Z"
}
```

---

## Pricing Structure

### Parking Fees

All places have separate bike and car parking fees following Indonesian standards:

- **Bike Parking**: ~40% of car parking cost
- **Car Parking**: 5,000 - 15,000 IDR depending on attraction tier

### Tiers

| Tier | Bike Fee | Car Fee | Category |
|------|----------|---------|----------|
| Standard | 2,000 | 5,000 | Temples, waterfalls, beaches, museums |
| Premium | 5,000 | 10,000 | High-rated parks, cultural centers |
| Luxury | 7,000 | 15,000 | Premium amusement parks |

### Extra Expenses

Additional optional costs:

| Type | Icon | Price | Used For |
|------|------|-------|----------|
| Guide Fee | person.fill | 50,000 | Treks, nature walks |
| Equipment Rental | gearshape.fill | 75,000 | Water sports, activities |
| Meal Included | fork.knife | 80-100,000 | Parks, cultural centers |
| Photo Printing | camera.fill | 25,000 | Museums, galleries |

### Total Cost Example

```
Place: Waterbom Bali
- Entrance: 350,000 IDR
- Bike Parking: 5,000 IDR
- Car Parking: 10,000 IDR
- Meal Included: 100,000 IDR

Total by Bike: 455,000 IDR
Total by Car: 460,000 IDR
```

---

## Common Workflows

### Discover → Plan → Manage

1. **User discovers places**: Call `/swipe/cards` with location and filters
2. **User creates plan**: Call `POST /plans` with selected place IDs
3. **User organizes trip**: Call `PUT /plans/:id` to arrange by day/time
4. **User views plan**: Call `GET /plans/:id` to see full details

### Search Examples

```bash
# All 128 places sorted by distance
GET /swipe/cards?lat=-8.5069&lng=115.2625

# All places in Ubud area
GET /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=2

# Budget attractions only
GET /swipe/cards?lat=-8.5069&lng=115.2625&budgetId=1

# Cultural places near user
GET /swipe/cards?lat=-8.5069&lng=115.2625&tagIds=8

# Water activities
GET /swipe/cards?lat=-8.5069&lng=115.2625&tagIds=3,4,5
```

---

## Tag Icons (SF Symbols)

All tags use Apple SF Symbols for iOS:

| Tag | Icon | Usage |
|-----|------|-------|
| amusement-park | ticket | Theme parks, entertainment |
| art | paintbrush | Art galleries, exhibitions |
| beachfront | water.waves | Beaches, coastal areas |
| culture | building.2 | Temples, historical sites |
| dining | fork.knife | Restaurants, cafes |
| education | book | Museums, educational |
| entertainment | star.fill | Shows, performances |
| family-friendly | person.2 | Kid-friendly attractions |
| nature | leaf | Natural areas, parks |
| outdoor | tree | Outdoor activities |
| sightseeing | binoculars | Viewpoints, landmarks |
| wildlife | pawprint | Animal sanctuaries, zoos |

---

## Regencies (8 total)

| ID | Name | Places | Characteristics |
|----|------|--------|-----------------|
| 1 | Kabupaten Badung | 33 | Kuta, Seminyak, tourist beaches, water parks |
| 2 | Kabupaten Gianyar | 43 | Ubud, rice terraces, trekking, cultural sites |
| 3 | Kabupaten Buleleng | 15 | North coast, diving, waterfalls, natural |
| 4 | Kabupaten Bangli | 2 | Mountain treks, temples |
| 5 | Kabupaten Klungkung | 2 | Historical sites, water activities |
| 6 | Kota Denpasar | 15 | Capital city, museums, urban attractions |
| 7 | Kabupaten Tabanan | 14 | Rice terraces, waterfalls, temples |
| 8 | Kabupaten Karangasem | 4 | East Bali, water activities |

---

## Rate Limiting

No rate limiting is currently implemented. Please use responsibly.

---

## Changelog

### Latest
- Plan API v2.0.0: Simplified to flat `places` array (removed `items`/`dayIndex`/`visitTime`/`notes`)
- Plan `PUT /plans/:id` now accepts `placeIds` to replace the full places list
- Plan `POST /plans/:id/items` simplified to just `{ placeId }`
- Swipe API v1.2.0: Split parking fees into `bikeParkingFee` and `carParkingFee`
- 128 places across 8 Bali regencies
- Complete place details with pricing, tags, extra expenses
- Google Places API integration for photos

---

## Support

For issues or feature requests, please contact the development team.
