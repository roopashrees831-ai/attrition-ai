import React, { useState, useEffect } from 'react';
import { modelsApi } from '../services/api';
import { Cpu, Award, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await modelsApi.getMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error("Failed to load metrics:", err);
        setError("No trained model metrics found. Please train models in Dataset Management.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 border-r-transparent" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm">
        {error || 'Model metrics unavailable.'}
      </div>
    );
  }

  const cm = metrics.confusion_matrix || [[0, 0], [0, 0]];
  const tn = cm[0]?.[0] || 0;
  const fp = cm[0]?.[1] || 0;
  const fn = cm[1]?.[0] || 0;
  const tp = cm[1]?.[1] || 0;

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">
          Model Evaluation & Comparative Performance
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Detailed accuracy, precision, recall, F1-score, ROC-AUC metrics, and confusion matrix across trained classification models
        </p>
      </div>

      {/* Model Comparison Table */}
      <div className="glass-card rounded-2xl border-[#3A245C] overflow-hidden p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
          <Award className="w-4 h-4 text-purple-400" />
          <span>Classifier Algorithm Comparison</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#3A245C] bg-[#120B20]/80 text-gray-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Model Algorithm</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Accuracy</th>
                <th className="py-3 px-4 font-semibold">Precision</th>
                <th className="py-3 px-4 font-semibold">Recall</th>
                <th className="py-3 px-4 font-semibold">F1-Score</th>
                <th className="py-3 px-4 font-semibold">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A245C]/60">
              {metrics.all_models_comparison.map((m: any, idx: number) => (
                <tr key={idx} className={`hover:bg-[#1A1030]/60 ${m.is_best ? 'bg-purple-950/20' : ''}`}>
                  <td className="py-3.5 px-4 font-bold text-gray-200 flex items-center space-x-2">
                    <span>{m.model_name}</span>
                    {m.is_best && (
                      <span className="text-[10px] bg-purple-900 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/40">
                        BEST MODEL
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      m.is_best ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'text-gray-400'
                    }`}>
                      {m.is_best ? 'Active Predictor' : 'Evaluated'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">{(m.f1_score * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">{(m.roc_auc * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix Card */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>Confusion Matrix ({metrics.best_model_name})</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center text-xs pt-2">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] text-gray-400 block font-mono">TRUE NEGATIVE (Retained)</span>
              <span className="text-2xl font-extrabold text-emerald-300 font-['Outfit']">{tn}</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              <span className="text-[10px] text-gray-400 block font-mono">FALSE POSITIVE (Type I)</span>
              <span className="text-2xl font-extrabold text-amber-300 font-['Outfit']">{fp}</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              <span className="text-[10px] text-gray-400 block font-mono">FALSE NEGATIVE (Type II)</span>
              <span className="text-2xl font-extrabold text-amber-300 font-['Outfit']">{fn}</span>
            </div>

            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 space-y-1">
              <span className="text-[10px] text-gray-400 block font-mono">TRUE POSITIVE (Attrited)</span>
              <span className="text-2xl font-extrabold text-red-300 font-['Outfit']">{tp}</span>
            </div>
          </div>
        </div>

        {/* Feature Importance Rankings */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Top Predictive Feature Importances</span>
          </h3>

          <div className="space-y-3">
            {metrics.feature_importances.map((feat: any, idx: number) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-300">{idx + 1}. {feat.feature}</span>
                  <span className="text-purple-400 font-mono">{(feat.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#1A1030] h-2 rounded-full overflow-hidden border border-[#3A245C]">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-purple-400 to-violet-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, feat.importance * 100 * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
