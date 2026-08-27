import React, { useState, useEffect } from 'react';
import { companyApi } from '../services/api';
import { Building2, Database, Cpu, Users, Calendar, ShieldCheck } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companyApi.getCurrent();
        setCompany(data);
      } catch (err) {
        console.error("Failed to load company info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">
          Company Settings & Data Tenant Profile
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage company data isolation, dataset status, active ML predictor model, and user permissions
        </p>
      </div>

      {company && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Company Details Card */}
          <div className="md:col-span-6 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
            <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Enterprise Organization Metadata</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Company Name</span>
                <span className="font-semibold text-white">{company.company_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Industry Vertical</span>
                <span className="font-semibold text-purple-300">{company.industry}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Data Tenant ID</span>
                <span className="font-mono text-gray-300">TENANT-{String(company.id).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Data Isolation</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Strict Multi-Tenant Isolated</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dataset & Model Status Card */}
          <div className="md:col-span-6 glass-card p-6 rounded-2xl border-[#3A245C] space-y-4">
            <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Active Dataset & Model Specifications</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Active Dataset CSV</span>
                <span className="font-mono text-purple-300 truncate max-w-[200px]">{company.active_dataset}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Total Employee Records</span>
                <span className="font-semibold text-white">{company.total_employees} Employees</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Active ML Predictor Model</span>
                <span className="font-bold text-emerald-400 font-mono">{company.active_model}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#3A245C]">
                <span className="text-gray-400">Validation Model Accuracy</span>
                <span className="font-bold text-white font-mono">{company.model_accuracy ? `${company.model_accuracy}%` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
