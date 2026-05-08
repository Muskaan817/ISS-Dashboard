import axios from 'axios';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

const CACHE_KEY = 'news_dashboard_cache';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

export const fetchNews = async (category = 'science', forceRefresh = false) => {
  if (!API_KEY) {
    console.warn('News API Key is missing. Please add VITE_NEWS_API_KEY to your .env file.');
    return [];
  }

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
    const response = await axios.get(`${BASE_URL}/top-headlines`, {
      params: {
        category,
        language: 'en',
        pageSize: 10,
        apiKey: API_KEY,
      },
    });

    const articles = response.data.articles.map((article, index) => ({
      id: `${category}-${index}`,
      title: article.title,
      source: article.source.name,
      author: article.author || 'Unknown',
      date: article.publishedAt,
      image: article.urlToImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000', // Default space image
      description: article.description || 'No description available.',
      url: article.url,
      category,
    }));

    // Update cache
    localStorage.setItem(
      `${CACHE_KEY}_${category}`,
      JSON.stringify({ data: articles, timestamp: Date.now() })
    );

    return articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const searchNews = async (query) => {
  if (!API_KEY) return [];
  
  try {
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: query,
        language: 'en',
        pageSize: 10,
        apiKey: API_KEY,
      },
    });

    return response.data.articles.map((article, index) => ({
      id: `search-${index}`,
      title: article.title,
      source: article.source.name,
      author: article.author || 'Unknown',
      date: article.publishedAt,
      image: article.urlToImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
      description: article.description || 'No description available.',
      url: article.url,
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
};
