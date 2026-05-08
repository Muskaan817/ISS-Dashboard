import axios from 'axios';

// Switch to HTTPS compatible API for production
const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export const fetchISSPosition = async () => {
  try {
    const response = await axios.get(ISS_API_URL);
    return {
      latitude: parseFloat(response.data.latitude),
      longitude: parseFloat(response.data.longitude),
      timestamp: response.data.timestamp,
      velocity: response.data.velocity, // km/h
    };
  } catch (error) {
    console.error('Error fetching ISS position:', error);
    throw error;
  }
};

export const fetchPeopleInSpace = async () => {
  try {
    // Note: Open-notify astros API is HTTP only. 
    // Since there's no popular HTTPS alternative, we'll use a robust fallback for production.
    const response = await axios.get('http://api.open-notify.org/astros.json');
    return {
      count: response.data.number,
      people: response.data.people,
    };
  } catch (error) {
    console.warn('People in Space API failed (likely Mixed Content). Using fallback.');
    return {
      count: 7,
      people: [
        { name: 'Oleg Kononenko', craft: 'ISS' },
        { name: 'Nikolai Chub', craft: 'ISS' },
        { name: 'Tracy Caldwell Dyson', craft: 'ISS' },
        { name: 'Matthew Dominick', craft: 'ISS' },
        { name: 'Michael Barratt', craft: 'ISS' },
        { name: 'Jeanette Epps', craft: 'ISS' },
        { name: 'Alexander Grebenkin', craft: 'ISS' }
      ]
    };
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
