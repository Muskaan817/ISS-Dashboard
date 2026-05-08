import React, { useState, useEffect, useRef } from 'react';
import { fetchNews, searchNews } from '../services/newsService';
import NewsCard from './NewsCard';
import { Search, RefreshCw, Newspaper, Info, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const CATEGORIES = ['science', 'technology', 'general'];

const NewsDashboard = () => {
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // null means show all
  const [sortBy, setSortBy] = useState('date');
  const chartRef = useRef(null);

  const loadArticles = async (force = false) => {
    setLoading(true);
    setActiveCategory(null);
    setSearchQuery('');
    try {
      const promises = CATEGORIES.map(cat => fetchNews(cat, force));
      const results = await Promise.all(promises);
      // Flatten the array and remove duplicates just in case
      const combined = results.flat();
      const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
      setAllArticles(unique);
      if (force) toast.success("News feed updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load news articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }
    setLoading(true);
    setActiveCategory(null);
    try {
      const results = await searchNews(searchQuery);
      setAllArticles(results);
    } catch (error) {
      toast.error("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Distribution
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = allArticles.filter(a => a.category === cat).length;
    return acc;
  }, {});

  const chartData = {
    labels: CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [
      {
        data: CATEGORIES.map(c => categoryCounts[c] || 0),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        hoverBackgroundColor: ['#2563eb', '#059669', '#d97706'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#6b7280',
          font: { family: 'Outfit', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} articles`
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const clickedCat = CATEGORIES[index];
        // Toggle filter
        setActiveCategory(prev => prev === clickedCat ? null : clickedCat);
      }
    },
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    }
  };

  // Filtering & Sorting
  let displayedArticles = [...allArticles];
  
  if (activeCategory) {
    displayedArticles = displayedArticles.filter(a => a.category === activeCategory);
  }

  displayedArticles.sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'source') return a.source.localeCompare(b.source);
    return 0;
  });

  return (
    <div className="space-y-8">
      
      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Info size={20} className="text-purple-500" />
          News Distribution by Category
        </h3>
        <p className="text-xs text-gray-500 mb-6">Click on a section of the doughnut to filter articles below.</p>
        
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="h-[250px] w-full max-w-md mx-auto">
             <Doughnut data={chartData} options={chartOptions} ref={chartRef} />
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white">
            <Newspaper size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {activeCategory ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} News` : 'All Space News'}
            </h2>
            <p className="text-xs text-gray-500">
              {activeCategory ? 'Filtered view (Click chart to reset)' : 'Stay updated with latest discoveries'}
            </p>
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

          {activeCategory && (
            <button 
              onClick={() => setActiveCategory(null)}
              className="px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold text-xs rounded-2xl hover:bg-red-100 transition-colors"
            >
              Clear Filter
            </button>
          )}

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
      {loading && allArticles.length === 0 ? (
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
      ) : displayedArticles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No articles found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedArticles.slice(0, 12).map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;
