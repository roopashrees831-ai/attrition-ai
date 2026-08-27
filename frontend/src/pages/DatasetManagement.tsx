import React, { useState, useEffect } from 'react';
import { datasetsApi, modelsApi } from '../services/api';
import { Upload, FileText, CheckCircle2, Cpu, AlertCircle, RefreshCw, Table, ArrowRight, Layers } from 'lucide-react';

export const DatasetManagement: React.FC = () => {
  const [activeDataset, setActiveDataset] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [targetCol, setTargetCol] = useState('Attrition');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState<string[]>([]);
  const [trainResult, setTrainResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchActiveDataset = async () => {
    try {
      const data = await datasetsApi.getActive();
      setActiveDataset(data);
      if (data.target_col) setTargetCol(data.target_col);
      if (data.column_mapping) setMapping(data.column_mapping);
    } catch (err) {
      console.log("No active dataset yet.");
    }
  };

  useEffect(() => {
    fetchActiveDataset();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setTrainResult(null);

    try {
      const res = await datasetsApi.upload(file);
      setUploadResult(res);
      setTargetCol(res.suggested_target || 'Attrition');
      setMapping(res.suggested_mapping || {});
      setActiveDataset(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!activeDataset?.dataset_id) return;
    try {
      await datasetsApi.mapColumns(activeDataset.dataset_id, targetCol, mapping);
      alert('Column mapping saved successfully.');
    } catch (err: any) {
      setError('Failed to save column mapping.');
    }
  };

  const handleTrainModels = async () => {
    const datasetId = uploadResult?.dataset_id || activeDataset?.dataset_id;
    if (!datasetId) {
      setError('Please upload or select a dataset first.');
      return;
    }

    setTraining(true);
    setError('');
    setTrainProgress([
      'Validating dataset schema & null values...',
      'Preprocessing features & encoding categorical columns...',
      'Training Logistic Regression, Random Forest, & Gradient Boosting models...',
      'Evaluating cross-validation metrics & ROC-AUC...',
      'Selecting optimal model artifact...'
    ]);

    try {
      const res = await modelsApi.train(datasetId);
      setTrainResult(res);
      fetchActiveDataset();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const currentSummary = uploadResult?.summary || activeDataset?.data_summary || {};

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">
          Dataset & AutoML Training Management
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Upload custom Kaggle/enterprise CSV employee datasets, map schema attributes, and trigger automated ML model training
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Upload Card & Active Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CSV Upload Section */}
        <div className="lg:col-span-6 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Upload Enterprise Employee Dataset (CSV)</span>
          </h3>

          <div className="border-2 border-dashed border-[#3A245C] hover:border-purple-500/50 rounded-2xl p-8 text-center bg-[#1A1030]/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center space-y-2">
              <FileText className="w-8 h-8 text-purple-400" />
              <p className="text-xs font-semibold text-gray-200">
                {file ? file.name : 'Drag and drop your CSV dataset here, or click to browse'}
              </p>
              <p className="text-[10px] text-gray-400">
                Supports Kaggle IBM HR Attrition CSV schemas up to 50MB
              </p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-purple-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {uploading ? (
              <span>Analyzing Dataset Schema...</span>
            ) : (
              <>
                <span>Upload & Profile Dataset</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Dataset Profile Overview */}
        <div className="lg:col-span-6 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
            <Table className="w-4 h-4 text-purple-400" />
            <span>Active Dataset Analytics & Metrics</span>
          </h3>

          {currentSummary.rows ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 block text-[11px]">Total Row Count</span>
                <span className="font-extrabold text-white text-lg font-['Outfit']">{currentSummary.rows?.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 block text-[11px]">Total Column Count</span>
                <span className="font-extrabold text-white text-lg font-['Outfit']">{currentSummary.cols}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 block text-[11px]">Missing Values</span>
                <span className="font-extrabold text-emerald-400 text-lg font-['Outfit']">{currentSummary.missing_values || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 block text-[11px]">Detected Target Column</span>
                <span className="font-bold text-purple-300 text-sm font-mono">{currentSummary.target_col || 'Attrition'}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#1A1030]/40 rounded-xl border border-[#3A245C]">
              No active dataset loaded. Upload a CSV to view analytics.
            </div>
          )}
        </div>
      </div>

      {/* Column Mapping Interface */}
      {currentSummary.columns && (
        <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Intelligent Column Mapping Interface</span>
            </h3>
            <button
              onClick={handleSaveMapping}
              className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-900"
            >
              Save Column Mappings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {currentSummary.columns.map((col: string) => (
              <div key={col} className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] flex items-center justify-between">
                <span className="font-mono text-gray-300 truncate max-w-[120px]">{col}</span>
                <span className="text-gray-500">→</span>
                <input
                  type="text"
                  value={mapping[col] || col}
                  onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                  className="bg-[#090612] border border-[#3A245C] rounded-lg px-2 py-1 text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500 w-32"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Model Training & Live Stepper */}
      <div className="glass-card p-6 rounded-2xl border-[#3A245C] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-200 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <span>Automated Model Training Pipeline</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Trains Logistic Regression, Random Forest, & Gradient Boosting to select optimal ROC-AUC predictor
            </p>
          </div>

          <button
            onClick={handleTrainModels}
            disabled={training}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-xs shadow-purple-glow hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Training Pipeline...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Run AutoML Model Training</span>
              </>
            )}
          </button>
        </div>

        {/* Live Stepper Indicator */}
        {training && (
          <div className="p-4 rounded-xl bg-[#1A1030] border border-purple-500/30 space-y-2 text-xs font-mono">
            <h4 className="text-purple-300 font-bold uppercase text-[10px] tracking-wider mb-2">MODEL TRAINING PROGRESS</h4>
            {trainProgress.map((step, i) => (
              <div key={i} className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Training Result Metric Card */}
        {trainResult && (
          <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">AutoML Training Completed Successfully</h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900 text-purple-200 border border-purple-400/30 font-semibold font-mono">
                Best Model: {trainResult.best_model_name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-lg bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 text-[10px] block">Accuracy Score</span>
                <span className="font-extrabold text-white text-base font-mono">{(trainResult.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 text-[10px] block">Precision</span>
                <span className="font-extrabold text-white text-base font-mono">{(trainResult.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 text-[10px] block">F1-Score</span>
                <span className="font-extrabold text-purple-300 text-base font-mono">{(trainResult.f1_score * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-[#1A1030] border border-[#3A245C]">
                <span className="text-gray-400 text-[10px] block">ROC-AUC Score</span>
                <span className="font-extrabold text-emerald-400 text-base font-mono">{(trainResult.roc_auc * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
