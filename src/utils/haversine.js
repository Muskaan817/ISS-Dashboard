/**
 * Calculates the distance between two points on the Earth (Haversine formula).
 * @param {number} lat1 - Latitude of point 1 in decimal degrees
 * @param {number} lon1 - Longitude of point 1 in decimal degrees
 * @param {number} lat2 - Latitude of point 2 in decimal degrees
 * @param {number} lon2 - Longitude of point 2 in decimal degrees
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Calculates speed in km/h based on distance and time interval.
 * @param {number} distance - Distance in kilometers
 * @param {number} timeIntervalSeconds - Time interval in seconds
 * @returns {number} Speed in km/h
 */
export const calculateSpeed = (distance, timeIntervalSeconds) => {
  const hours = timeIntervalSeconds / 3600;
  return distance / hours;
};
