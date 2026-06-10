# Swipe API Documentation

## Overview

The Swipe API provides endpoints for discovering and filtering travel places in Bali. All places include ratings, pricing, location coordinates, photos, tags, and optional extra expenses.

## Quick Start Workflow

1. Call `/swipe/tags` to get available tags with their IDs for filtering
2. Call `/swipe/regencies` to get available regencies (districts/cities) with their IDs
3. Call `/swipe/budgets` to get available budget tiers
4. Call `/swipe/cards` with your location and filters to get places matching your criteria

---

## Endpoints

### GET `/swipe/cards`

Returns all matching place cards sorted by distance from your location.

#### Required Parameters
- `lat` (number): Your current latitude (e.g., -8.5069)
- `lng` (number): Your current longitude (e.g., 115.2625)

#### Optional Parameters
- `regencyId` (number): Filter by regency ID
- `tagIds` (string): Comma-separated tag IDs (e.g., "1,9")
- `category` (string): Filter by place category
- `radius` (number): Search radius in meters (e.g., 50000 for 50km)
- `budgetId` (number): Filter by budget tier

#### Response Format

```json
{
  "count": 33,
  "data": [
    {
      "id": 300,
      "name": "Objek Wisata Sangeh",
      "rating": 4.6,
      "totalRatings": 166,
      "priceLevel": 3,
      "price": 350000,
      "bikeParkingFee": 5000,
      "carParkingFee": 10000,
      "category": "zoo",
      "address": "Jalan Brahmana, Sangeh",
      "district": null,
      "regency": {
        "id": 1,
        "name": "Kabupaten Badung"
      },
      "province": "Bali",
      "description": "Monkey forest with around 700 primates...",
      "tags": [
        {
          "id": 1,
          "name": "wildlife",
          "iconName": "pawprint"
        },
        {
          "id": 2,
          "name": "family-friendly",
          "iconName": "person.2"
        }
      ],
      "extraExpenses": [],
      "photoUrl": "https://maps.googleapis.com/maps/api/place/photo?...",
      "coordinates": {
        "lat": -8.4815663,
        "lng": 115.2065458
      },
      "distance": 6768,
      "driveTimeMinutes": 8
    }
  ]
}
```

#### Response Fields Explained

**Pricing:**
- `price`: Main entrance or activity fee in Indonesian Rupiah (IDR)
- `bikeParkingFee`: Motorcycle/bike parking cost in IDR
  - **2,000** = Standard attractions
  - **5,000** = Popular/premium attractions
  - **7,000** = Premium amusement parks
- `carParkingFee`: Car parking cost in IDR
  - **5,000** = Standard attractions (temples, waterfalls, beaches, museums)
  - **10,000** = Popular/premium attractions (high-rated parks, cultural centers, amusement parks)
  - **15,000** = Premium amusement parks with full facilities

**Extra Expenses:**
- `extraExpenses`: Array of optional additional costs:
  - **Guide Fee** (50,000 IDR) - For trekking, mountain activities, nature walks
  - **Equipment Rental** (75,000 IDR) - For water sports (surfing, jet ski, rafting, diving)
  - **Meal Included** (80,000-100,000 IDR) - For parks, cultural centers, amusement parks
  - **Photo Printing** (25,000 IDR) - For museums, galleries, tourist attractions

**Distance & Time:**
- `distance`: Distance in meters from your current location
- `driveTimeMinutes`: Estimated driving time (calculated at 50 km/h average speed)

#### Example Requests

```
# All 128 places, sorted by distance
GET /swipe/cards?lat=-8.5069&lng=115.2625

# All 33 places in Badung regency (Kuta, Seminyak area)
GET /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=1

# All 43 places in Gianyar regency (Ubud area)
GET /swipe/cards?lat=-8.5069&lng=115.2625&regencyId=2

# Places with specific tags (nature OR trekking)
GET /swipe/cards?lat=-8.5069&lng=115.2625&tagIds=7,21

# Mid-range attractions (75k-200k IDR) within 50km
GET /swipe/cards?lat=-8.5069&lng=115.2625&budgetId=2&radius=50000

# Water parks category only
GET /swipe/cards?lat=-8.5069&lng=115.2625&category=amusement_park
```

---

### GET `/swipe/tags`

Returns all available tags for filtering places.

#### Response Format
```json
[
  {
    "id": 1,
    "name": "wildlife",
    "iconName": "pawprint"
  },
  {
    "id": 2,
    "name": "family-friendly",
    "iconName": "person.2"
  },
  ...
]
```

---

### GET `/swipe/regencies`

Returns all Bali regencies (administrative divisions).

#### Response Format
```json
[
  {
    "id": 1,
    "name": "Kabupaten Badung"
  },
  {
    "id": 2,
    "name": "Kabupaten Gianyar"
  },
  ...
]
```

#### Available Regencies

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

### GET `/swipe/regencies/:id/tags`

Returns only the tags used by places in a specific regency.

#### Parameters
- `id` (number): Regency ID

#### Response Format
```json
{
  "regency": {
    "id": 2,
    "name": "Kabupaten Gianyar"
  },
  "tags": [
    {
      "id": 7,
      "name": "nature",
      "iconName": "leaf"
    },
    {
      "id": 6,
      "name": "outdoor",
      "iconName": "tree"
    },
    ...
  ]
}
```

---

### GET `/swipe/budgets`

Returns available budget tiers for filtering places by price range.

#### Response Format
```json
[
  {
    "id": 1,
    "name": "Budget",
    "minPrice": 0,
    "maxPrice": 75000
  },
  {
    "id": 2,
    "name": "Mid-Range",
    "minPrice": 75000,
    "maxPrice": 200000
  },
  {
    "id": 3,
    "name": "Premium",
    "minPrice": 200000,
    "maxPrice": 500000
  }
]
```

---

## Pricing Strategy by Regency

### Regency 1 - Kabupaten Badung (33 places)
- Main tourist area: Kuta, Seminyak, Nusa Dua
- **Parking Fees**: 0 (water sports) to 15,000 (premium parks)
- **Extra Expenses**: Guide fees, equipment rental, meals, photos
- **Price Range**: 0 - 350,000 IDR

### Regency 2 - Kabupaten Gianyar (43 places)
- Cultural hub: Ubud, rice terraces, temples
- **Parking Fees**: 0 (water activities) to 10,000 (parks)
- **Extra Expenses**: Guide fees, equipment rental (rafting), meals, photos
- **Price Range**: 0 - 350,000 IDR

### Regency 3 - Kabupaten Buleleng (15 places)
- North coast: diving spots, waterfalls, natural attractions
- **Parking Fees**: 5,000 - 10,000
- **Extra Expenses**: Meals, photos
- **Price Range**: 0 - 350,000 IDR

### Regency 4 - Kabupaten Bangli (2 places)
- Mountain trekking area
- **Parking Fees**: 5,000
- **Extra Expenses**: Guide fees (mountain treks)
- **Price Range**: 0 IDR

### Regency 5 - Kabupaten Klungkung (2 places)
- Historical sites and water activities
- **Parking Fees**: 5,000
- **Extra Expenses**: Photos (museums)
- **Price Range**: 0 IDR

### Regency 6 - Kota Denpasar (15 places)
- Capital city, museums, urban attractions
- **Parking Fees**: 5,000 - 10,000
- **Extra Expenses**: Equipment rental (sports), photos
- **Price Range**: 0 - 350,000 IDR

### Regency 7 - Kabupaten Tabanan (14 places)
- West Bali, rice terraces, temples, waterfalls
- **Parking Fees**: 5,000 - 10,000
- **Extra Expenses**: Guide fees, photos
- **Price Range**: 0 - 50,000 IDR

### Regency 8 - Kabupaten Karangasem (4 places)
- East Bali, water activities and nature
- **Parking Fees**: 5,000
- **Extra Expenses**: Equipment rental (water sports)
- **Price Range**: 0 IDR

---

## Total Cost Calculation

To calculate the total cost for a visitor at a place:

```
For Motorcycle/Bike:
Total Cost = price + bikeParkingFee + sum(extraExpenses[].price)

For Car:
Total Cost = price + carParkingFee + sum(extraExpenses[].price)
```

### Example: Ubud Bali White Water Rafting (Regency 2)
```
price: 0 IDR
bikeParkingFee: 2,000 IDR / carParkingFee: 5,000 IDR
extraExpenses: Equipment Rental (75,000 IDR)

By motorcycle: 0 + 2,000 + 75,000 = 77,000 IDR
By car: 0 + 5,000 + 75,000 = 80,000 IDR
```

### Example: Waterbom Bali (Regency 1)
```
price: 350,000 IDR
bikeParkingFee: 5,000 IDR / carParkingFee: 10,000 IDR
extraExpenses: Meal Included (100,000 IDR)

By motorcycle: 350,000 + 5,000 + 100,000 = 455,000 IDR
By car: 350,000 + 10,000 + 100,000 = 460,000 IDR
```

---

## Data Quality Notes

- **bikeParkingFee** and **carParkingFee** are separate fields following Indonesian pricing ratios
- Bike parking is approximately 40% of car parking cost
- **extraExpenses** only includes meaningful, optional costs for each place type
- **Price range** varies by regency and place type
- **No duplication**: Parking is never listed in extraExpenses
- **Equipment rental** only appears for water sports and activity-based attractions
- All data is realistic and makes sense for the place category

---

## Error Responses

### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "lat and lng are required parameters"
}
```

### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Regency with id {id} not found"
}
```

### 500 - Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

No rate limiting is currently implemented. Please use responsibly.

## Changelog

### v1.2.0 - Latest
- Split `parkingFee` into `bikeParkingFee` and `carParkingFee`
- Implemented Indonesian parking fee ratios (bike ≈ 40% of car)
- All 128 places now have separate bike and car parking fees
- Updated all examples and documentation

### v1.1.0
- Added `parkingFee` field at root level (same level as `price`)
- Removed duplicate parking charges from `extraExpenses`
- Added realistic extra expenses for all place types
- Updated pricing structure for all 8 regencies
- Improved documentation

### v1.0.0
- Initial API release
- Basic place discovery with distance calculation
