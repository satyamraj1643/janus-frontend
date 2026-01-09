import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

const COLORS = ['#d93025', '#ea8600', '#f9ab00', '#1a73e8', '#5f6368', '#9aa0a6'];

const RejectionChart = ({ data }) => {
  // Transform object map to array for Recharts
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom label to show percentage
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white px-3 py-2 border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-800 mb-1 capitalize">
            {data.name}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{data.value}</span> jobs ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend - compact version
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        {payload.map((entry, index) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(0);
          return (
            <div key={`legend-${index}`} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 font-medium capitalize">
                {entry.value}
              </span>
              <span className="text-gray-500">
                ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-medium text-gray-900">Rejection Reasons</h3>
        </div>
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 font-medium">
          {total} Total
        </span>
      </div>
      
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rejection data</p>
            <p className="text-xs mt-1">Data will appear as jobs are rejected</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={1}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={renderLegend}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RejectionChart;