import React, { useState, useEffect } from 'react';
import { predictionsApi } from '../services/api';
import { Sliders, Zap, AlertTriangle, ShieldCheck, Clock, Sparkles, CheckCircle2, DollarSign, Briefcase, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const LivePredictor: React.FC = () => {
  const [formData, setFormData] = useState({
    Department: 'Engineering',
    JobRole: 'Software Engineer',
    Age: 32,
    MonthlyIncome: 5500,
    OverTime: 'Yes',
    JobSatisfaction: 2,
    WorkLifeBalance: 2,
    DistanceFromHome: 18,
    YearsAtCompany: 3,
    EnvironmentSatisfaction: 2,
    PerformanceRating: 3,
    StockOptionLevel: 0
  });

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async (currentData: typeof formData) => {
    setLoading(true);
    try {
      const res = await predictionsApi.predictSingle(currentData);
      setPrediction(res);
    } catch (err) {
      console.error("Live prediction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction(formData);
  }, []);

  const handleChange = (field: string, val: any) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);
    runPrediction(updated);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return { bg: 'bg-red-950/60 text-red-300 border-red-500/40', icon: AlertTriangle };
      case 'MEDIUM':
        return { bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40', icon: Clock };
      default:
        return { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40', icon: ShieldCheck };
    }
  };

  const riskBadge = prediction ? getRiskBadge(prediction.risk_level) : getRiskBadge('LOW');
  const BadgeIcon = riskBadge.icon;
  const probPct = prediction ? Math.round(prediction.probability * 100) : 0;

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-purple-400" />
          <span>Interactive Live Employee Attrition Risk Predictor</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Adjust employee parameters in real time to simulate what-if retention scenarios and inspect live ML feature attribution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Parameters Controls */}
        <div className="lg:col-span-6 glass-card p-6 rounded-2xl border-[#3A245C] space-y-5">
          <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2 border-b border-[#3A245C] pb-3">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Employee Parameter Inputs</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Department & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Department</label>
                <select
                  value={formData.Department}
                  onChange={(e) => handleChange('Department', e.target.value)}
                  className="w-full bg-[#1A1030] border border-[#3A245C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Job Role</label>
                <input
                  type="text"
                  value={formData.JobRole}
                  onChange={(e) => handleChange('JobRole', e.target.value)}
                  className="w-full bg-[#1A1030] border border-[#3A245C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Overtime Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A1030] border border-[#3A245C]">
              <div>
                <span className="font-semibold text-gray-200 block">Frequent OverTime Workload</span>
                <span className="text-[10px] text-gray-400">Pushes attrition probability significantly higher</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleChange('OverTime', 'Yes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.OverTime === 'Yes'
                      ? 'bg-amber-600 text-white shadow-amber-glow'
                      : 'bg-[#090612] text-gray-400 border border-[#3A245C]'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('OverTime', 'No')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.OverTime === 'No'
                      ? 'bg-purple-600 text-white shadow-purple-glow'
                      : 'bg-[#090612] text-gray-400 border border-[#3A245C]'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Monthly Income Slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">Monthly Compensation ($)</span>
                <span className="text-emerald-400 font-mono font-bold">${formData.MonthlyIncome.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={20000}
                step={250}
                value={formData.MonthlyIncome}
                onChange={(e) => handleChange('MonthlyIncome', Number(e.target.value))}
                className="w-full accent-purple-500 bg-[#1A1030]"
              />
            </div>

            {/* Job Satisfaction */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">Job Satisfaction Rating</span>
                <span className="text-purple-300 font-mono font-bold">Level {formData.JobSatisfaction} / 4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleChange('JobSatisfaction', level)}
                    className={`py-1.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                      formData.JobSatisfaction === level
                        ? 'bg-purple-900/60 border-purple-500 text-white'
                        : 'bg-[#1A1030] border-[#3A245C] text-gray-400'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Life Balance */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">Work-Life Balance Rating</span>
                <span className="text-purple-300 font-mono font-bold">Level {formData.WorkLifeBalance} / 4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleChange('WorkLifeBalance', level)}
                    className={`py-1.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                      formData.WorkLifeBalance === level
                        ? 'bg-purple-900/60 border-purple-500 text-white'
                        : 'bg-[#1A1030] border-[#3A245C] text-gray-400'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance & Years at Company Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Commute Distance</span>
                  <span className="text-amber-400 font-mono">{formData.DistanceFromHome} Miles</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={formData.DistanceFromHome}
                  onChange={(e) => handleChange('DistanceFromHome', Number(e.target.value))}
                  className="w-full accent-purple-500 bg-[#1A1030]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Tenure at Company</span>
                  <span className="text-violet-300 font-mono">{formData.YearsAtCompany} Years</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={formData.YearsAtCompany}
                  onChange={(e) => handleChange('YearsAtCompany', Number(e.target.value))}
                  className="w-full accent-purple-500 bg-[#1A1030]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Prediction Results & Technical XAI */}
        <div className="lg:col-span-6 space-y-6">
          {/* Risk Gauge Card */}
          <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Live ML Attrition Probability</span>
              </h3>
              {loading && <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1A133A] to-[#120D2B] border border-[#3A245C] flex flex-col items-center justify-center text-center space-y-3 relative shadow-purple-glow">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest font-mono">
                Calculated Risk Probability
              </span>

              <div className="text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
                {probPct}%
              </div>

              {prediction && (
                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center space-x-2 ${riskBadge.bg}`}>
                  <BadgeIcon className="w-4 h-4" />
                  <span>{prediction.risk_level} ATTRITION RISK</span>
                </div>
              )}
            </div>
          </div>

          {/* Technical Feature Contributions (XAI Chart) */}
          {prediction?.feature_contributions && (
            <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
              <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Feature Impact Contribution Breakdown</span>
              </h3>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prediction.feature_contributions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A245C" />
                    <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="feature" type="category" stroke="#9CA3AF" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#120B20', borderColor: '#3A245C', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="contribution" fill="#A78BFA" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tailored AI Action Checklist */}
          {prediction?.recommendations && (
            <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-3">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simulated Retention Action Plan</span>
              </h3>

              <div className="space-y-2">
                {prediction.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1A1030]/80 border border-[#3A245C] flex items-start space-x-3 text-xs">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                      rec.priority === 'URGENT' ? 'bg-red-900/60 text-red-300 border border-red-500/40' :
                      rec.priority === 'HIGH' ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40' :
                      'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                    }`}>
                      {rec.priority}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-200">{rec.title}</h4>
                      <p className="text-gray-400 mt-0.5 text-[11px]">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
