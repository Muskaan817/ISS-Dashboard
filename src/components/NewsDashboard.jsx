import React, { useState, useEffect } from 'react';
import { fetchNews, searchNews } from '../services/newsService';
import NewsCard from './NewsCard';
import { Search, RefreshCw, Filter, Newspaper, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const NewsDashboard = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('science');
  const [sortBy, setSortBy] = useState('date');

  const loadArticles = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchNews(category, force);
      setArticles(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load news articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [category]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }
    setLoading(true);
    try {
      const results = await searchNews(searchQuery);
      setArticles(results);
    } catch (error) {
      toast.error("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'source') return a.source.localeCompare(b.source);
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white">
            <Newspaper size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Space News</h2>
            <p className="text-xs text-gray-500">Stay updated with latest discoveries</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-grow md:flex-initial">
            <input
              type="text"
              placeholder="Search news..."
              className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          </form>

          <select
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="science">Science</option>
            <option value="technology">Technology</option>
            <option value="general">General</option>
          </select>

          <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'date' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('source')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'source' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'
              }`}
            >
              Source
            </button>
          </div>

          <button
            onClick={() => loadArticles(true)}
            className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading && articles.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[450px] bg-white dark:bg-gray-900 rounded-3xl animate-pulse overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-800" />
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No articles found. Try another search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedArticles.slice(0, 10).map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;
