import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';

interface DemoCompany {
  id: number;
  company_name: string;
  industry: string;
  requires_credentials: boolean;
  login_label: string;
  dataset_label: string;
  demo_email?: string | null;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const [companies, setCompanies] = useState<DemoCompany[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await authApi.getDemoCompanies();
        setCompanies(data);
        if (data.length > 0) {
          setCompanyName(data[0].company_name);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
        setError('Could not load company datasets. Make sure the backend is running.');
      }
    };
    fetchCompanies();
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.company_name === companyName),
    [companies, companyName]
  );

  const selectCompany = (company: DemoCompany) => {
    setCompanyName(company.company_name);
    setError('');
    setPassword('');
    setEmail(company.requires_credentials ? company.demo_email || '' : '');
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCompany) return;

    setLoading(true);
    setError('');
    try {
      if (selectedCompany.requires_credentials) {
        await login(email, password, selectedCompany.company_name);
      } else {
        await demoLogin(selectedCompany.company_name);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090612] neural-bg flex items-center justify-center p-5 lg:p-8 relative overflow-hidden select-none">
      <div className="absolute -top-48 -left-24 h-[32rem] w-[32rem] rounded-full bg-fuchsia-700/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-56 -right-24 h-[36rem] w-[36rem] rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch z-10">
        <section className="lg:col-span-5 rounded-[2rem] border border-[#3A245C] bg-[#120B20]/80 backdrop-blur-xl p-7 lg:p-9 shadow-[0_24px_80px_rgba(25,10,45,0.5)] flex flex-col justify-between min-h-[650px]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/70 border border-violet-400/30 text-violet-200 text-[11px] font-mono mb-8">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              MULTI-COMPANY ATTRITION INTELLIGENCE
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-purple-700 p-[1px] shadow-[0_0_35px_rgba(192,132,252,0.28)]">
                <div className="w-full h-full rounded-[15px] bg-[#090612] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-violet-200" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight font-['Outfit']">
                  ATTRITION <span className="text-violet-300">AI</span>
                </h1>
                <p className="text-xs text-violet-300/70 font-mono">Predict • Prevent • Retain</p>
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.05] font-['Outfit'] max-w-md">
              One model experience. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">Three company datasets.</span>
            </h2>
            <p className="text-sm text-slate-400 leading-6 mt-5 max-w-lg">
              Compare employee attrition behavior across IBM HR Analytics and two IBM-schema-compatible workforce datasets with isolated dashboards, predictions and ML metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 mt-8">
            {[
              { icon: Database, label: '3 isolated', value: 'Datasets' },
              { icon: BarChart3, label: 'Per company', value: 'ML Insights' },
              { icon: ShieldCheck, label: 'One secure', value: 'Login Flow' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.value} className="rounded-2xl bg-[#1A1030]/80 border border-[#3A245C] p-4">
                  <Icon className="w-5 h-5 text-violet-300 mb-3" />
                  <p className="text-[11px] text-slate-500">{item.label}</p>
                  <p className="text-sm font-bold text-violet-100">{item.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-7 glass-card rounded-[2rem] p-6 lg:p-8 border-[#3A245C] shadow-[0_24px_80px_rgba(25,10,45,0.5)] min-h-[650px]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-mono text-violet-300 uppercase tracking-[0.2em]">Workspace Access</p>
              <h2 className="text-2xl font-extrabold text-white font-['Outfit'] mt-1">Choose a company</h2>
              <p className="text-xs text-slate-400 mt-1">Each selection loads its own workforce dataset and trained model.</p>
            </div>
            <div className="inline-flex items-center gap-2 text-[11px] text-violet-200 bg-violet-950/60 border border-violet-400/20 rounded-full px-3 py-1.5 w-fit">
              <UserCheck className="w-3.5 h-3.5" />
              Tenant-isolated demo
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {companies.map((company, index) => {
              const isSelected = company.company_name === companyName;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => selectCompany(company)}
                  className={`relative text-left rounded-2xl border p-4 transition-all duration-200 min-h-[156px] ${
                    isSelected
                      ? 'border-violet-400/70 bg-gradient-to-b from-violet-900/45 to-fuchsia-950/30 shadow-[0_0_30px_rgba(167,139,250,0.12)]'
                      : 'border-[#3A245C] bg-[#1A1030]/65 hover:border-violet-400/40 hover:bg-[#21133B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-violet-400/20 text-violet-200' : 'bg-[#090612] text-slate-400'}`}>
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-violet-300/70">0{index + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-4 leading-4">{company.company_name}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-4">{company.dataset_label}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-violet-200">
                    {company.requires_credentials ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    {company.requires_credentials ? 'Email + password' : 'One-click demo'}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCompany && (
            <div className="rounded-2xl border border-[#3A245C] bg-[#0D0818]/70 p-5 lg:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs text-violet-300 font-semibold">Selected workspace</p>
                  <h3 className="text-xl font-bold text-white font-['Outfit'] mt-0.5">{selectedCompany.company_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedCompany.industry}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${selectedCompany.requires_credentials ? 'bg-fuchsia-950/50 text-fuchsia-200 border-fuchsia-400/30' : 'bg-violet-950/60 text-violet-200 border-violet-400/30'}`}>
                  {selectedCompany.requires_credentials ? 'SECURE COMPANY' : 'DEMO ACCESS'}
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-400/30 text-rose-200 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleContinue} className="space-y-4">
                {selectedCompany.requires_credentials ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-violet-200 mb-2">Company email</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-violet-300/60 absolute left-3.5 top-3.5" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full bg-[#1A1030] border border-[#3A245C] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                            placeholder="hr@company.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-violet-200 mb-2">Password</label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-violet-300/60 absolute left-3.5 top-3.5" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full bg-[#1A1030] border border-[#3A245C] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                            placeholder="Enter password"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-violet-950/30 border border-violet-400/20 px-4 py-3 text-[11px] text-slate-400">
                      Demo credentials: <span className="text-violet-200 font-mono">hr@lavendersystems.com</span> / <span className="text-violet-200 font-mono">Lavender@2026</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-violet-950/30 border border-violet-400/20 px-4 py-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-violet-100">No credentials needed for this demo company.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click continue to open the company-specific dashboard, employees, predictions and model performance.</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-[0_0_30px_rgba(167,139,250,0.25)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Opening workspace...' : selectedCompany.login_label}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
