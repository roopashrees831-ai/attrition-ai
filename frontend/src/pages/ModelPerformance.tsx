import React, { useState, useEffect } from 'react';
import { modelsApi } from '../services/api';
import { Cpu, Award, BarChart2, CheckCircle2, Database, SlidersHorizontal, Scale, Info } from 'lucide-react';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipelineInfo, setPipelineInfo] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [metricsResult, pipelineResult] = await Promise.allSettled([
          modelsApi.getMetrics(),
          modelsApi.getPipelineInfo(),
        ]);

        if (metricsResult.status !== 'fulfilled') {
          throw metricsResult.reason;
        }

        setMetrics(metricsResult.value);
        if (pipelineResult.status === 'fulfilled') {
          setPipelineInfo(pipelineResult.value);
        }
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

      {/* Compact Best-Model Metrics: values come directly from the metrics API */}
      <div className="glass-card rounded-2xl border-[#3A245C] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-200">Active Model Performance</h3>
            <p className="text-[11px] text-gray-400 mt-1">Actual stored evaluation metrics for {metrics.best_model_name}. No fallback values are displayed.</p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 w-fit">
            TEST-SET METRICS
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ['Accuracy', metrics.accuracy],
            ['Precision', metrics.precision],
            ['Recall', metrics.recall],
            ['F1 Score', metrics.f1_score],
            ['ROC-AUC', metrics.roc_auc],
          ].filter(([, value]) => typeof value === 'number').map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-[#3A245C] bg-[#1A1030]/80 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-mono">{label}</p>
              <p className="text-lg font-extrabold text-white mt-1 font-['Outfit']">{((value as number) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Truthful pipeline / optimization summary */}
      {pipelineInfo && (
        <div className="glass-card rounded-2xl border-[#3A245C] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30">
              <SlidersHorizontal className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200">Preprocessing & Model Optimization Actually Used</h3>
              <p className="text-[11px] text-gray-400 mt-1">This section reports only steps implemented in the current backend pipeline.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#1A1030]/75 border border-[#3A245C] p-4">
              <div className="flex items-center gap-2 text-purple-300 font-bold mb-2">
                <Database className="w-4 h-4" /> Preprocessing
              </div>
              <ul className="space-y-1.5 text-gray-300">
                {pipelineInfo.preprocessing?.map((item: string) => <li key={item}>• {item}</li>)}
                <li>• {pipelineInfo.data_split}</li>
              </ul>
            </div>

            <div className="rounded-xl bg-[#1A1030]/75 border border-[#3A245C] p-4">
              <div className="flex items-center gap-2 text-purple-300 font-bold mb-2">
                <Scale className="w-4 h-4" /> Training & Selection
              </div>
              <ul className="space-y-1.5 text-gray-300">
                <li>• {pipelineInfo.model_comparison}</li>
                <li>• {pipelineInfo.model_selection}</li>
                <li>• {pipelineInfo.balancing?.details}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3 flex items-start gap-2 text-[11px] text-amber-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Not currently implemented: feature-selection algorithm, k-fold cross-validation, SMOTE/oversampling, or automated hyperparameter search. The app does not claim these as active optimizations.</p>
          </div>
        </div>
      )}

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
