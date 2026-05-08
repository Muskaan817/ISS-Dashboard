import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Navigation, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const ISSTracker = () => {
  const [position, setPosition] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const timerRef = useRef(null);

  const fetchPosition = async () => {
    setError(null);
    try {
      // Note: http://api.open-notify.org/iss-now.json is HTTP.
      // If deployed on HTTPS (Vercel), this may cause a Mixed Content error.
      const response = await axios.get('http://api.open-notify.org/iss-now.json');
      
      const newPos = {
        lat: parseFloat(response.data.iss_position.latitude),
        lon: parseFloat(response.data.iss_position.longitude),
        timestamp: response.data.timestamp
      };

      setPosition(newPos);
      setHistory(prev => {
        const newHistory = [...prev, newPos];
        // Keep only the last 15 positions
        return newHistory.slice(-15);
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch ISS position:', err);
      setError('Unable to track ISS at the moment. Please check your connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosition();

    // Set up polling every 15 seconds
    timerRef.current = setInterval(fetchPosition, 15000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (loading && !position) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Connecting to ISS...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Navigation className="w-6 h-6 rotate-45" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ISS Live Tracker</h2>
            <p className="text-xs text-blue-100 opacity-80">Updating every 15 seconds</p>
          </div>
        </div>
        <button 
          onClick={fetchPosition}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Manual Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Latitude Card */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Latitude</span>
              </div>
              <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                {position?.lat.toFixed(6)}°
              </p>
            </div>

            {/* Longitude Card */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 rotate-90" />
                <span className="text-xs font-bold uppercase tracking-wider">Longitude</span>
              </div>
              <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                {position?.lon.toFixed(6)}°
              </p>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Live Connection</span>
            </div>
            <div className="text-xs text-gray-400">
              Positions Tracked: <span className="font-bold text-gray-600 dark:text-gray-300">{history.length}</span>
            </div>
          </div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
            Last Sync: {lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ISSTracker;
