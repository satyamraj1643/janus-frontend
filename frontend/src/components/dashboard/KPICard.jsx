import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  // Map color prop to clean flat colors
  const colorMap = {
    'bg-blue-500': 'bg-blue-600',
    'bg-green-500': 'bg-green-600',
    'bg-red-500': 'bg-red-600',
    'bg-purple-500': 'bg-blue-600',
  };
  const flatColor = colorMap[color] || 'bg-blue-600';

  return (
    <div className="bg-white p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 ${flatColor}`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${
            trend === 'up' 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

export default KPICard;