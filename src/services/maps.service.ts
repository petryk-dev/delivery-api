import { LocationCoords } from '../types';

// TODO: Install @googlemaps/google-maps-services-js and implement real calls
// import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
// import { GOOGLE_MAPS_API_KEY } from '../config/maps';
// const client = new Client({});

export async function geocodeAddress(_address: string): Promise<LocationCoords> {
  // TODO: Implement real geocoding
  // const res = await client.geocode({ params: { address, key: GOOGLE_MAPS_API_KEY } });
  // const { lat, lng } = res.data.results[0].geometry.location;
  // return { lat, lng };
  return { lat: 0, lng: 0 };
}

export async function getEstimatedArrival(
  _origin: LocationCoords,
  _destination: LocationCoords,
): Promise<{ durationSeconds: number; distanceMeters: number }> {
  // TODO: Implement real Distance Matrix call
  // const res = await client.distancematrix({ params: { ... } });
  return { durationSeconds: 0, distanceMeters: 0 };
}
