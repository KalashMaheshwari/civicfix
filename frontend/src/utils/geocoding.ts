/**
 * OpenStreetMap Nominatim Reverse Geocoding Utility.
 * Converts GPS Latitude & Longitude to human-readable street/ward address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();

    const addr = data.address || {};
    const street = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
    const city = addr.city || addr.state_district || addr.state || 'Delhi';
    const postcode = addr.postcode ? ` - ${addr.postcode}` : '';

    if (street) {
      return `${street}, ${city}${postcode}`;
    }
    return data.display_name?.split(',').slice(0, 3).join(',') || `Ward-04 Landmark Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (err) {
    console.warn('Reverse geocoding fallback:', err);
    return `Ward-04 Landmark Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}
