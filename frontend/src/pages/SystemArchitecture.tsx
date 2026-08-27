import React from 'react';
import { GitMerge, Cpu, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  const systemFlow = [
    "Company User",
    "JWT Authentication",
    "React + Vite Frontend",
    "FastAPI REST API",
    "Dataset Profiler & Mapper",
    "AutoML Pipeline",
    "Predictive Risk Engine",
    "Explainable AI (XAI)",
    "AI Retention Engine",
    "Executive Dashboard"
  ];

  const mlFlow = [
    "Raw Kaggle / Enterprise CSV",
    "Data Cleaning & Imputation",
    "Feature Scaling & OneHot Encoding",
    "Stratified Train/Test Split",
    "Train Logistic Reg, RF, & Gradient Boosting",
    "Cross-Validation Metrics (ROC-AUC & F1)",
    "Best Model Selection & Joblib Save",
    "Individual Employee Probability Calculation",
    "Feature Impact Attribution (XAI)",
    "Actionable HR Retention Strategy"
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center space-x-2">
          <GitMerge className="w-6 h-6 text-purple-400" />
          <span>System Architecture & Viva Presentation Blueprint</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Technical flowcharts, end-to-end engineering pipelines, and Responsible AI guidelines for academic & project evaluations
        </p>
      </div>

      {/* System Architecture Flow */}
      <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Full-Stack Application Architecture Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {systemFlow.map((step, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C] text-center space-y-1 relative group hover:border-purple-500/50 transition-colors">
              <span className="text-[10px] font-mono text-purple-400 font-bold block">STEP {String(idx + 1).padStart(2, '0')}</span>
              <span className="text-xs font-semibold text-gray-200 block">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ML Pipeline Flow */}
      <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
          <GitMerge className="w-4 h-4 text-violet-400" />
          <span>Machine Learning Lifecycle & AutoML Pipeline</span>
        </h3>

        <div className="space-y-2">
          {mlFlow.map((step, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#1A1030]/70 border border-[#3A245C] flex items-center space-x-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-400 text-[10px] shrink-0">
                {idx + 1}
              </div>
              <span className="font-semibold text-gray-200">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsible AI & Ethics Module */}
      <div className="glass-card p-6 rounded-2xl border-amber-500/30 bg-amber-950/10 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-amber-200 font-['Outfit']">
            Responsible AI & Ethics Compliance Guidelines
          </h3>
        </div>

        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] text-amber-300 font-bold font-mono">
            "Predictions are probabilistic estimates, not certainties."
          </p>

          <ul className="space-y-2 list-disc list-inside text-gray-300">
            <li>
              <strong className="text-white">Decision Support Tool Only:</strong> Machine Learning predictions are designed solely to assist HR leadership in proactive retention planning and should NEVER be used as the sole basis for employment termination or adverse actions.
            </li>
            <li>
              <strong className="text-white">Protected Demographic Exclusion:</strong> Personal protected attributes (such as age or gender) are evaluated with strict bias safeguards to prevent discriminatory decision-making.
            </li>
            <li>
              <strong className="text-white">Human-in-the-Loop Governance:</strong> All AI retention recommendations require human manager evaluation, stay-interview confirmation, and organizational context before implementation.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
