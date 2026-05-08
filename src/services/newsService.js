import axios from 'axios';

const BASE_URL = 'https://api.spaceflightnewsapi.net/v4';

const CACHE_KEY = 'astro_news_cache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch articles from Spaceflight News API
 * @param {string} category - Used for filtering or search
 * @param {boolean} forceRefresh - Ignore cache
 */
export const fetchNews = async (category = 'general', forceRefresh = false) => {
  // Check cache
  if (!forceRefresh) {
    const cachedData = localStorage.getItem(`${CACHE_KEY}_${category}`);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
  }

  try {
    const params = {
      limit: 12,
      ordering: '-published_at'
    };

    // Simulate categories with search terms if needed, 
    // but SNAPI is already specific to space.
    if (category !== 'general') {
      params.search = category;
    }

    const response = await axios.get(`${BASE_URL}/articles/`, { params });

    const articles = response.data.results.map((article) => ({
      id: article.id.toString(),
      title: article.title,
      source: article.news_site,
      author: article.news_site, // SNAPI doesn't always have authors, using site name
      date: article.published_at,
      image: article.image_url,
      description: article.summary || 'No description available.',
      url: article.url,
      category: category,
    }));

    // Update cache
    localStorage.setItem(
      `${CACHE_KEY}_${category}`,
      JSON.stringify({ data: articles, timestamp: Date.now() })
    );

    return articles;
  } catch (error) {
    console.error('Error fetching space news:', error);
    throw error;
  }
};

/**
 * Search articles
 */
export const searchNews = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/articles/`, {
      params: {
        search: query,
        limit: 10,
      },
    });

    return response.data.results.map((article) => ({
      id: article.id.toString(),
      title: article.title,
      source: article.news_site,
      author: article.news_site,
      date: article.published_at,
      image: article.image_url,
      description: article.summary || 'No description available.',
      url: article.url,
    }));
  } catch (error) {
    console.error('Error searching space news:', error);
    return [];
  }
};
