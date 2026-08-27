import React, { useState, useEffect } from 'react';
import { predictionsApi } from '../services/api';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Lightbulb } from 'lucide-react';

export const WorkforceInsights: React.FC = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await predictionsApi.getInsights();
        setInsights(data);
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 border-r-transparent" />
      </div>
    );
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Danger':
        return { bg: 'bg-red-950/60 text-red-300 border-red-500/40', icon: AlertTriangle };
      case 'Warning':
        return { bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40', icon: TrendingUp };
      default:
        return { bg: 'bg-purple-950/60 text-purple-300 border-purple-500/40', icon: Lightbulb };
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span>AI Workforce Insights & Strategic Intelligence</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Automated macro analysis synthesized across complete enterprise workforce dataset records
        </p>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((item) => {
          const badge = getCategoryBadge(item.category);
          const BadgeIcon = badge.icon;

          return (
            <div key={item.id} className="glass-card glass-card-hover p-6 rounded-2xl border-[#3A245C] space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${badge.bg}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{item.category.toUpperCase()} ALERT</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {item.stat_highlight}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-300 font-medium mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C] text-xs text-gray-400 leading-relaxed">
                {item.detail}
              </div>

              <div className="pt-2 border-t border-[#3A245C] flex items-start space-x-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-200 block">Recommended Executive Action:</span>
                  <span>{item.recommendation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
