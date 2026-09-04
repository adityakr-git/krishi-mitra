import { MandiCenter } from '../types';

/**
 * Default fallback coordinates for Gurugram district farmers
 * Village: Khandsa, Sector 37, Gurugram
 */
export const DEFAULT_FARMER_COORDS = {
  latitude: 28.4350,
  longitude: 77.0120,
  villageName: 'Khandsa, Gurugram'
};

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine Formula
 * 
 * Formula:
 *   a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *   c = 2 ⋅ atan2( √a, √(1−a) )
 *   d = R ⋅ c
 * 
 * @param lat1 Latitude of origin point
 * @param lon1 Longitude of origin point
 * @param lat2 Latitude of destination point
 * @param lon2 Longitude of destination point
 * @returns Distance in kilometers rounded to 1 decimal place
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

export interface MandiDistanceItem extends MandiCenter {
  calculatedDistanceKm: number;
  totalTurnaroundMinutes: number;
  isSmartRecommendation?: boolean;
  recommendationReason?: {
    en: string;
    hi: string;
    savedMinutes: number;
    extraKm: number;
  };
}

/**
 * Smart AI Recommendation Engine ("The Mitra Feature"):
 * Balances physical travel distance against current queue wait times.
 * If the closest mandi has severe congestion, recommends a slightly farther
 * mandi that saves hours of waiting!
 */
export function computeNearbyMandisWithSmartMitra(
  mandis: MandiCenter[],
  userLat: number,
  userLon: number
): {
  sortedMandis: MandiDistanceItem[];
  smartRecommendation?: MandiDistanceItem;
} {
  // 1. Calculate distance and total turnaround for all mandis
  const computedList: MandiDistanceItem[] = mandis.map((m) => {
    const dist = calculateDistance(userLat, userLon, m.lat, m.lng);
    // 1 km ≈ 3.5 minutes travel time for tractor trolley
    const travelTimeMins = Math.round(dist * 3.5);
    const turnaround = m.avgWaitMinutes + travelTimeMins;

    return {
      ...m,
      calculatedDistanceKm: dist,
      totalTurnaroundMinutes: turnaround
    };
  });

  // Sort by calculated distance ascending
  const sortedByDistance = [...computedList].sort(
    (a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm
  );

  if (sortedByDistance.length === 0) {
    return { sortedMandis: [] };
  }

  const closestMandi = sortedByDistance[0];

  // Find mandi with the lowest overall turnaround time
  const bestTurnaroundMandi = [...computedList].sort(
    (a, b) => a.totalTurnaroundMinutes - b.totalTurnaroundMinutes
  )[0];

  let smartRecommendation: MandiDistanceItem | undefined;

  // If the best turnaround mandi saves >= 15 minutes over the closest mandi
  if (
    bestTurnaroundMandi.id !== closestMandi.id &&
    closestMandi.avgWaitMinutes - bestTurnaroundMandi.avgWaitMinutes >= 15
  ) {
    const savedMinutes = closestMandi.avgWaitMinutes - bestTurnaroundMandi.avgWaitMinutes;
    const extraKm = Math.max(
      0.5,
      Math.round((bestTurnaroundMandi.calculatedDistanceKm - closestMandi.calculatedDistanceKm) * 10) / 10
    );

    const savedHours = (savedMinutes / 60).toFixed(1);

    bestTurnaroundMandi.isSmartRecommendation = true;
    bestTurnaroundMandi.recommendationReason = {
      en: `Save ~${savedMinutes} mins (${savedHours} hrs) waiting time with only ${extraKm} km extra travel!`,
      hi: `केवल ${extraKm} किमी अतिरिक्त चलकर ~${savedMinutes} मिनट (लगभग ${savedHours} घंटे) का प्रतीक्षा समय बचाएं!` ,
      savedMinutes,
      extraKm
    };

    smartRecommendation = bestTurnaroundMandi;
  }

  return {
    sortedMandis: sortedByDistance,
    smartRecommendation
  };
}
