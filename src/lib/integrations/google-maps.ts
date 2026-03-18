// Google Maps integration adapter

interface GoogleMapsConfig {
  apiKey: string;
}

interface TravelTimeResult {
  durationMinutes: number;
  distance: string;
  leaveByTime: Date;
}

interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class GoogleMapsAdapter {
  private config: GoogleMapsConfig;

  constructor(config: GoogleMapsConfig) {
    this.config = config;
  }

  /**
   * Validate and format an address
   */
  async validateAddress(address: string): Promise<AddressValidationResult> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return {
        isValid: true,
        formattedAddress: `${address} (Validated)`,
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      };
    }

    try {
      const params = new URLSearchParams({
        address,
        key: this.config.apiKey
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          isValid: true,
          formattedAddress: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          }
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('Address validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Calculate travel time between two addresses
   */
  async getTravelTime(
    origin: string,
    destination: string,
    departureTime?: Date,
    travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<TravelTimeResult> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      const mockDurationMinutes = Math.floor(Math.random() * 45) + 15; // 15-60 minutes
      const targetTime = departureTime || new Date();
      const leaveByTime = new Date(targetTime.getTime() - (mockDurationMinutes * 60 * 1000));

      return {
        durationMinutes: mockDurationMinutes,
        distance: `${Math.floor(Math.random() * 20) + 5} miles`,
        leaveByTime
      };
    }

    try {
      const params = new URLSearchParams({
        origins: origin,
        destinations: destination,
        mode: travelMode,
        units: 'imperial',
        key: this.config.apiKey
      });

      if (departureTime) {
        params.append('departure_time', Math.floor(departureTime.getTime() / 1000).toString());
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Distance Matrix failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const durationMinutes = Math.ceil(element.duration.value / 60);
        const targetTime = departureTime || new Date();
        const leaveByTime = new Date(targetTime.getTime() - (durationMinutes * 60 * 1000));

        return {
          durationMinutes,
          distance: element.distance.text,
          leaveByTime
        };
      }

      throw new Error('No route found');
    } catch (error) {
      console.error('Travel time calculation failed:', error);
      // Fallback to default estimate
      const defaultDurationMinutes = 30;
      const targetTime = departureTime || new Date();
      const leaveByTime = new Date(targetTime.getTime() - (defaultDurationMinutes * 60 * 1000));

      return {
        durationMinutes: defaultDurationMinutes,
        distance: 'Unknown',
        leaveByTime
      };
    }
  }

  /**
   * Get multiple travel time options (driving, transit, walking)
   */
  async getTravelTimeOptions(
    origin: string,
    destination: string,
    departureTime?: Date
  ): Promise<Array<{
    mode: string;
    duration: number;
    distance: string;
    leaveByTime: Date;
  }>> {
    const modes: Array<'driving' | 'transit' | 'walking'> = ['driving', 'transit', 'walking'];
    const results = [];

    for (const mode of modes) {
      try {
        const result = await this.getTravelTime(origin, destination, departureTime, mode);
        results.push({
          mode: mode.charAt(0).toUpperCase() + mode.slice(1),
          duration: result.durationMinutes,
          distance: result.distance,
          leaveByTime: result.leaveByTime
        });
      } catch (error) {
        console.error(`Failed to get travel time for ${mode}:`, error);
        // Continue with other modes
      }
    }

    return results;
  }

  /**
   * Generate a Google Maps URL for directions
   */
  generateDirectionsUrl(
    origin: string,
    destination: string,
    travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): string {
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      travelmode: travelMode
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  /**
   * Search for nearby places (e.g., schools, parks)
   */
  async searchNearbyPlaces(
    location: string,
    placeType: string,
    radius: number = 5000 // meters
  ): Promise<Array<{
    name: string;
    address: string;
    distance?: string;
    rating?: number;
  }>> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return [
        {
          name: `Sample ${placeType} 1`,
          address: '123 Main St, Anytown, USA',
          distance: '0.5 miles',
          rating: 4.5
        },
        {
          name: `Sample ${placeType} 2`,
          address: '456 Oak Ave, Anytown, USA',
          distance: '1.2 miles',
          rating: 4.2
        }
      ];
    }

    try {
      // First, geocode the location to get coordinates
      const geocodeResult = await this.validateAddress(location);
      if (!geocodeResult.isValid || !geocodeResult.coordinates) {
        throw new Error('Invalid location for search');
      }

      const params = new URLSearchParams({
        location: `${geocodeResult.coordinates.lat},${geocodeResult.coordinates.lng}`,
        radius: radius.toString(),
        type: placeType,
        key: this.config.apiKey
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Places search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.slice(0, 10).map((place: any) => ({
          name: place.name,
          address: place.vicinity || place.formatted_address,
          rating: place.rating
        }));
      }

      return [];
    } catch (error) {
      console.error('Places search failed:', error);
      return [];
    }
  }
}