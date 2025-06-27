import axios from "axios";

export class LocationService {
  private static readonly EARTH_RADIUS = 6371; // Radius of the Earth in km

  static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number; radius?: number }
  ): number {
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS * c * 1000; // Convert to meters
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { "User-Agent": "YourAppName (contact@email.com)" }
        }
      );
      
      const address = response.data.address;
      return [
        address.road,
        address.city || address.town,
        address.country
      ].filter(Boolean).join(", ");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}