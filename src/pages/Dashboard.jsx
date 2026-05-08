import React, { useState, useEffect, useRef } from 'react';
import { fetchISSPosition, fetchPeopleInSpace, getReverseGeocode } from '../services/issService';
import { fetchNews, searchNews } from '../services/newsService';
import { calculateDistance, calculateSpeed } from '../utils/haversine';
import ISSMap from '../components/ISSMap';
import SpeedChart from '../components/SpeedChart';
import ISSTracker from '../components/ISSTracker';
import NewsDashboard from '../components/NewsDashboard';
import ChatBot from '../components/ChatBot';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Users, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  Newspaper,
  Info,
  Loader2
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Dashboard = () => {
  // ISS State
  const [issPosition, setIssPosition] = useState({ latitude: 0, longitude: 0, timestamp: 0 });
  const [trajectory, setTrajectory] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nearestPlace, setNearestPlace] = useState('Fetching...');
  const [astronauts, setAstronauts] = useState({ count: 0, people: [] });
  
  // News State
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsCategory, setNewsCategory] = useState('science');
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  
  // Global State
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const prevPositionRef = useRef(null);

  // 1. Initial Load & ISS Polling
  useEffect(() => {
    const initData = async () => {
      try {
        const pos = await fetchISSPosition();
        setIssPosition(pos);
        setTrajectory([pos]);
        
        const astros = await fetchPeopleInSpace();
        setAstronauts(astros);
        
        const place = await getReverseGeocode(pos.latitude, pos.longitude);
        setNearestPlace(place);
        
        await loadNews();
        
        setIsInitialLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load initial data. Check your connection.");
        setIsInitialLoading(false);
      }
    };

    initData();

    const interval = setInterval(async () => {
      try {
        const newPos = await fetchISSPosition();
        
        setIssPosition(prev => {
          // Calculate Speed
          if (prev.latitude !== 0) {
            const distance = calculateDistance(prev.latitude, prev.longitude, newPos.latitude, newPos.longitude);
            const timeDiff = newPos.timestamp - prev.timestamp; // in seconds
            if (timeDiff > 0) {
              const speed = calculateSpeed(distance, timeDiff);
              setCurrentSpeed(speed);
              setSpeedHistory(h => [...h.slice(-29), { timestamp: newPos.timestamp, speed }]);
            }
          }
          return newPos;
        });

        setTrajectory(t => [...t.slice(-14), newPos]);
        
        // Update Place every minute or so to save API calls
        const place = await getReverseGeocode(newPos.latitude, newPos.longitude);
        setNearestPlace(place);
        
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // 2. News Loading
  const loadNews = async (force = false) => {
    setIsLoadingNews(true);
    try {
      const articles = await fetchNews(newsCategory, force);
      setNews(articles);
      setFilteredNews(articles);
    } catch (error) {
      toast.error("Failed to fetch news.");
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (!isInitialLoading) loadNews();
  }, [newsCategory]);

  // 3. Search & Filter
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredNews(news);
      return;
    }
    setIsLoadingNews(true);
    try {
      const results = await searchNews(searchQuery);
      setFilteredNews(results);
    } catch (error) {
      toast.error("Search failed.");
    } finally {
      setIsLoadingNews(false);
    }
  };

  const sortNews = (type) => {
    const sorted = [...filteredNews];
    if (type === 'date') {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (type === 'source') {
      sorted.sort((a, b) => a.source.localeCompare(b.source));
    }
    setFilteredNews(sorted);
  };

  // Pie Chart Data (News Distribution by Category - simulation since we usually fetch one at a time)
  const newsDistData = {
    labels: ['Science', 'Technology', 'Space'],
    datasets: [{
      data: [12, 19, 3],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Launching Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <ToastContainer position="top-right" theme="colored" />
      
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Navigation size={24} className="rotate-45" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">AstroDash</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-500 uppercase font-bold">ISS Position</p>
              <p className="text-sm font-mono">{issPosition.latitude.toFixed(4)}, {issPosition.longitude.toFixed(4)}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* ISS Tracking System - Modular Component */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <ISSTracker />
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<MapPin className="text-blue-500" />} 
            title="Nearest Place" 
            value={nearestPlace} 
            subValue={`Lat: ${issPosition.latitude.toFixed(2)} | Lon: ${issPosition.longitude.toFixed(2)}`}
          />
          <StatCard 
            icon={<TrendingUp className="text-green-500" />} 
            title="Current Speed" 
            value={`${currentSpeed.toFixed(0)} km/h`} 
            subValue="Average orbital velocity"
          />
          <StatCard 
            icon={<Users className="text-purple-500" />} 
            title="People in Space" 
            value={astronauts.count} 
            subValue={`${astronauts.people.slice(0, 2).map(p => p.name).join(', ')}...`}
            onClick={() => toast.info(`Astronauts: ${astronauts.people.map(p => p.name).join(', ')}`)}
          />
        </div>

        {/* Map & Speed Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 p-1 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <ISSMap position={issPosition} trajectory={trajectory} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  Speed Trend
                </h3>
                <SpeedChart data={speedHistory} />
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 self-start">
                  <Info size={20} className="text-purple-500" />
                  News Distribution
                </h3>
                <div className="h-[180px]">
                  <Pie data={newsDistData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / People List */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                Current Crew
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs rounded-full">
                  {astronauts.count} Online
                </span>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {astronauts.people.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{p.craft}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white">
              <h3 className="font-bold mb-2">Did you know?</h3>
              <p className="text-sm text-blue-100">
                The ISS travels at about 28,000 km/h, meaning it circles the Earth once every 90 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* News Dashboard - Modular Component */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <NewsDashboard />
        </section>
      </main>

      <ChatBot dashboardData={{ 
        iss: { 
          latitude: issPosition.latitude, 
          longitude: issPosition.longitude, 
          speed: currentSpeed, 
          place: nearestPlace,
          peopleCount: astronauts.count,
          peopleNames: astronauts.people.map(p => p.name)
        }, 
        news: news.slice(0, 5) 
      }} />

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 AstroDash. Powered by NASA Open API & Mistral AI.</p>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, title, value, subValue, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 hover:scale-[1.02] transition-transform duration-300 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
        {icon}
      </div>
    </div>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold truncate">{subValue}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="h-[400px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      </div>
    </div>
  </div>
);

export default Dashboard;
