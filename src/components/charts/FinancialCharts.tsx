import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FinancialAnalysis } from '../../services/accountingService';
import { formatCurrency } from '../../utils/formatters';

interface FinancialChartsProps {
  analysis: FinancialAnalysis;
}

// Farby pre grafy
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

const FinancialCharts: React.FC<FinancialChartsProps> = ({ analysis }) => {
  // PrA?prava dA?t pre pie chart nA?kladov
  const expensesPieData = analysis.expenses.details.map((item, index) => ({
    name: item.account_name,
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  // PrA?prava dA?t pre pie chart vA?nosov
  const revenuePieData = analysis.revenue.details.map((item, index) => ({
    name: item.account_name,
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  // PrA?prava dA?t pre bar chart porovnania
  const comparisonData = [
    {
      name: 'VA?nosy',
      value: Math.max(0, analysis.revenue.total),
      color: '#10B981'
    },
    {
      name: 'NA?klady',
      value: Math.max(0, analysis.expenses.total),
      color: '#EF4444'
    },
    {
      name: analysis.isProfit ? 'Zisk' : 'Strata',
      value: Math.max(0, Math.abs(analysis.profit)),
      color: analysis.isProfit ? '#10B981' : '#EF4444'
    }
  ];

  // PrA?prava dA?t pre top nA?klady a vA?nosy
  const topExpenses = analysis.expenses.details
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item, index) => ({
      name: item.account_name,
      account: item.account,
      value: Math.max(0, item.amount),
      count: item.count,
      color: COLORS[index % COLORS.length]
    }));

  const topRevenue = analysis.revenue.details
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item, index) => ({
      name: item.account_name,
      account: item.account,
      value: Math.max(0, item.amount),
      count: item.count,
      color: COLORS[index % COLORS.length]
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          {data.account && (
            <p className="text-sm text-gray-500">As?Tet: {data.account}</p>
          )}
          <p className="text-sm text-gray-600">
            Suma: {formatCurrency(payload[0].value)}
          </p>
          {data.count && (
            <p className="text-sm text-gray-600">
              Po?Tet: {data.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Porovnanie VA?nosy vs NA?klady vs Zisk/Strata */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Porovnanie vA?nosov, nA?kladov a zisku/straty
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#8884d8">
              {comparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

             {/* Pie Charts - VA?nosy a NA?klady */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Pie Chart VA?nosy */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-medium text-gray-900 mb-4">
             RozloLlenie vA?nosov (As?Tty 6xx)
           </h3>
                      <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                               <Pie
                   data={revenuePieData}
                   cx="50%"
                   cy="50%"
                   labelLine={false}
                   outerRadius={120}
                   fill="#8884d8"
                   dataKey="value"
                 >
                  {revenuePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
         </div>

         {/* Pie Chart NA?klady */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-medium text-gray-900 mb-4">
             RozloLlenie nA?kladov (As?Tty 5xx)
           </h3>
                      <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                               <Pie
                   data={expensesPieData}
                   cx="50%"
                   cy="50%"
                   labelLine={false}
                   outerRadius={120}
                   fill="#8884d8"
                   dataKey="value"
                 >
                  {expensesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
         </div>
       </div>

      {/* Top 5 VA?nosy a NA?klady */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 VA?nosy */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top 5 vA?nosov
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10B981">
                {topRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 NA?klady */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top 5 nA?kladov
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#EF4444">
                {topExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ZiskovA? marLla gauge */}
      {analysis.revenue.total > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ZiskovA? marLla
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${analysis.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {((Math.abs(analysis.profit) / analysis.revenue.total) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {analysis.isProfit ? 'Zisk' : 'Strata'}
                  </div>
                </div>
              </div>
              <div 
                className={`absolute inset-0 rounded-full border-8 border-transparent ${
                  analysis.isProfit ? 'border-green-500' : 'border-red-500'
                }`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)`,
                  transform: `rotate(${Math.min((Math.abs(analysis.profit) / analysis.revenue.total) * 180, 180)}deg)`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCharts;

