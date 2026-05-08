import React from 'react';
import { ExternalLink, Calendar, User } from 'lucide-react';

const NewsCard = ({ article }) => {
  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000';
          }}
        />
        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded uppercase">
          {article.source}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {article.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mt-auto">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span className="truncate max-w-[100px]">{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(article.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
          >
            Read More
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
