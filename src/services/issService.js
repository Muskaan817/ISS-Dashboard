import axios from 'axios';

const ISS_BASE_URL = 'http://api.open-notify.org';
const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export const fetchISSPosition = async () => {
  try {
    // Note: open-notify.org is HTTP only. In production (HTTPS), this might be blocked by the browser.
    const response = await axios.get(`${ISS_BASE_URL}/iss-now.json`);
    return {
      latitude: parseFloat(response.data.iss_position.latitude),
      longitude: parseFloat(response.data.iss_position.longitude),
      timestamp: response.data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching ISS position:', error);
    // Fallback or rethrow
    throw error;
  }
};

export const fetchPeopleInSpace = async () => {
  try {
    const response = await axios.get(`${ISS_BASE_URL}/astros.json`);
    return {
      count: response.data.number,
      people: response.data.people,
    };
  } catch (error) {
    console.error('Error fetching people in space:', error);
    throw error;
  }
};

export const getReverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(`${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = response.data;
    
    if (data.city || data.locality || data.principalSubdivision) {
      return `${data.city || data.locality}${data.principalSubdivision ? `, ${data.principalSubdivision}` : ''}, ${data.countryName || ''}`;
    }
    
    return 'Over the Ocean';
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return 'Unknown Location';
  }
};
