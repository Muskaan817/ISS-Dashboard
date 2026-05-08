import React, { useState, useEffect, useRef } from 'react';
import { fetchISSPosition, fetchPeopleInSpace, getReverseGeocode } from '../services/issService';
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
  TrendingUp, 
  Loader2,
  Info
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const Dashboard = () => {
  // ISS State
  const [issPosition, setIssPosition] = useState({ latitude: 0, longitude: 0, timestamp: 0 });
  const [trajectory, setTrajectory] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nearestPlace, setNearestPlace] = useState('Fetching...');
  const [astronauts, setAstronauts] = useState({ count: 0, people: [] });
  const [newsContext, setNewsContext] = useState([]);
  
  // Global State
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
        
        // Fetch news for AI context
        try {
          const { fetchNews } = await import('../services/newsService');
          const articles = await fetchNews('general');
          setNewsContext(articles.slice(0, 5));
        } catch (e) { console.error('News context error:', e); }
        
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
          // Calculate Speed or use API velocity
          const speed = newPos.velocity || (prev.latitude !== 0 ? calculateSpeed(calculateDistance(prev.latitude, prev.longitude, newPos.latitude, newPos.longitude), newPos.timestamp - prev.timestamp) : 0);
          
          if (speed > 0) {
            setCurrentSpeed(speed);
            setSpeedHistory(h => [...h.slice(-29), { timestamp: newPos.timestamp, speed }]);
          }
          return newPos;
        });

        setTrajectory(t => [...t.slice(-14), newPos]);
        
        const place = await getReverseGeocode(newPos.latitude, newPos.longitude);
        setNearestPlace(place);
        
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Launching AstroDash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-['Outfit']">
      <Toaster position="top-right" />
      
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 transform hover:rotate-12 transition-transform cursor-pointer">
              <Navigation size={28} className="rotate-45" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                ASTRODASH
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-slate-500">Live ISS Tracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Signal
              </div>
              <p className="text-sm font-mono font-medium">{issPosition.latitude.toFixed(4)}, {issPosition.longitude.toFixed(4)}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* Core Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Map & Charts (8/12) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Real-time Map Container */}
            <div className="group relative bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-blue-500/10">
              <div className="overflow-hidden rounded-[2rem]">
                <ISSMap currentPosition={issPosition} trajectory={trajectory} />
              </div>
              <div className="absolute top-6 left-6 z-10">
                <div className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Live Position</span>
                </div>
              </div>
            </div>

            {/* Sub-stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Speed Velocity
                  </h3>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {currentSpeed.toFixed(0)} <span className="text-sm font-normal text-slate-400">km/h</span>
                  </span>
                </div>
                <div className="h-[220px]">
                  <SpeedChart data={speedHistory} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6">
                    <MapPin size={24} />
                  </div>
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-widest mb-1">Current Proximity</p>
                  <h3 className="text-3xl font-bold mb-4">{nearestPlace}</h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-indigo-100/70">
                    <span>LAT: {issPosition.latitude.toFixed(2)}</span>
                    <span>LON: {issPosition.longitude.toFixed(2)}</span>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Navigation size={200} className="rotate-45" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Crew & Info (4/12) */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Astronaut List Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[800px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Orbital Crew</h3>
                  <p className="text-xs text-slate-400 font-medium">Humans currently in space</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl font-bold">
                  {astronauts.count}
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {astronauts.people.map((p, i) => (
                  <div key={i} className="group flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/10">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{p.craft}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                    <Info size={16} className="text-blue-500" />
                    Quick Fact
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    The ISS moves at 7.66 km per second. That's about 10 times faster than a bullet!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width News Dashboard */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pt-10 border-t border-slate-200 dark:border-slate-800">
          <NewsDashboard />
        </section>
      </main>

      {/* Floating AI Assistant */}
      <ChatBot dashboardData={{ 
        iss: { 
          latitude: issPosition.latitude, 
          longitude: issPosition.longitude, 
          speed: currentSpeed, 
          place: nearestPlace,
          peopleCount: astronauts.count,
          peopleNames: astronauts.people.map(p => p.name)
        }, 
        news: newsContext 
      }} />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
             <Navigation size={20} className="rotate-45" />
             <span className="font-bold tracking-tighter">ASTRODASH</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© 2026 Space Tracking Systems. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-blue-500 transition-colors">API Status</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
