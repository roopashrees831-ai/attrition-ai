import React, { useEffect, useState } from 'react';
import { predictionsApi } from '../services/api';
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ArrowRight,
  Sliders
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await predictionsApi.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">
        {error}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Employees',
      value: summary.total_employees,
      icon: Users,
      bg: 'bg-purple-100',
      color: 'text-purple-600'
    },
    {
      label: 'High Risk',
      value: summary.high_risk_count,
      icon: AlertTriangle,
      bg: 'bg-red-100',
      color: 'text-red-500'
    },
    {
      label: 'Low Risk',
      value: summary.low_risk_count,
      icon: ShieldCheck,
      bg: 'bg-green-100',
      color: 'text-green-600'
    },
    {
      label: 'Attrition Rate',
      value: `${summary.attrition_rate}%`,
      icon: TrendingUp,
      bg: 'bg-violet-100',
      color: 'text-violet-600'
    }
  ];

  const pieData = (summary.risk_distribution || []).map((item: any) => {
    const name = String(item.name || '').toLowerCase();

    let color = '#86EFAC'; // green default

    if (name.includes('high')) color = '#F87171'; // red
    else if (name.includes('medium')) color = '#FACC15'; // yellow
    else if (name.includes('low')) color = '#86EFAC'; // green

    return {
      ...item,
      color
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1B4E]">
            Attrition Overview
          </h1>

          <p className="text-sm text-[#8A73B5] mt-1">
            Simple employee attrition analysis
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/live-predictor')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            <Sliders className="w-4 h-4" />
            Predictor
          </button>

          <button
            onClick={() => navigate('/predictions')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-purple-200 text-purple-600 text-sm hover:bg-purple-50"
          >
            Employees
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white border border-[#E8DFFF] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-[#2D1B4E] mt-2">
                    {item.value}
                  </p>
                </div>

                <div className={`p-3 rounded-xl ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Distribution */}
        <div className="bg-white border border-[#E8DFFF] rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D1B4E] flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-purple-500" />
            Employee Risk Distribution
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-[#5E4B84]">High Risk</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-[#5E4B84]">Medium Risk</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-[#5E4B84]">Low Risk</span>
            </div>
          </div>
        </div>

        {/* Department Chart */}
        <div className="bg-white border border-[#E8DFFF] rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D1B4E] flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            High Risk by Department
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.department_attrition}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EEE7FA"
                />

                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 11 }}
                  stroke="#8A73B5"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#8A73B5"
                />

                <Tooltip />

                <Bar
                  dataKey="high_risk"
                  fill="#A78BFA"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};