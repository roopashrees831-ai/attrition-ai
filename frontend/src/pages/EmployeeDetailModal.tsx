import React from 'react';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Calendar,
  MapPin,
  UserCheck,
  UserMinus
} from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: any;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose
}) => {
  if (!employee) return null;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-950/60 text-red-300 border-red-500/40',
          icon: AlertTriangle
        };

      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
          icon: Clock
        };

      default:
        return {
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
          icon: ShieldCheck
        };
    }
  };

  const riskBadge = getRiskBadge(employee.risk_level);
  const BadgeIcon = riskBadge.icon;

  // Probability values
  const leaveProbability = Math.max(
    0,
    Math.min(
      100,
      Math.round((Number(employee.probability) || 0) * 100)
    )
  );

  const stayProbability = 100 - leaveProbability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">

      <div className="glass-card w-full max-w-3xl rounded-3xl border-[#3A245C] max-h-[90vh] overflow-y-auto shadow-2xl relative">

        {/* HEADER */}

        <div className="p-6 border-b border-[#3A245C] flex items-center justify-between sticky top-0 bg-[#120B20]/90 backdrop-blur-md z-10">

          <div className="flex items-center space-x-3">

            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold">
              ID
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                Employee Profile & Risk Assessment
              </h2>

              <p className="text-xs text-purple-300 font-mono">
                Employee ID: {employee.employee_id}
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1A1030] border border-[#3A245C] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        <div className="p-6 space-y-6">

          {/* TOP OVERVIEW */}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

            {/* EMPLOYEE INFORMATION */}

            <div className="md:col-span-7 grid grid-cols-2 gap-3 text-xs">

              <div className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] space-y-1">

                <span className="text-gray-400 flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>Department & Role</span>
                </span>

                <p className="font-semibold text-gray-200 truncate">
                  {employee.job_role}
                </p>

                <p className="text-[10px] text-purple-400">
                  {employee.department}
                </p>

              </div>

              <div className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] space-y-1">

                <span className="text-gray-400 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Monthly Income</span>
                </span>

                <p className="font-semibold text-gray-200">
                  ${employee.monthly_income?.toLocaleString()}
                </p>

                <p className="text-[10px] text-gray-400">
                  Base Compensation
                </p>

              </div>

              <div className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] space-y-1">

                <span className="text-gray-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  <span>Tenure at Company</span>
                </span>

                <p className="font-semibold text-gray-200">
                  {employee.years_at_company} Years
                </p>

                <p className="text-[10px] text-gray-400">
                  Total Service
                </p>

              </div>

              <div className="p-3 rounded-xl bg-[#1A1030] border border-[#3A245C] space-y-1">

                <span className="text-gray-400 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Commute & Overtime</span>
                </span>

                <p className="font-semibold text-gray-200">
                  {employee.distance_from_home} Miles
                </p>

                <p className="text-[10px] text-purple-400">
                  Overtime: {employee.overtime}
                </p>

              </div>

            </div>

            {/* ATTRITION RESULT */}

            <div className="md:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-[#1A133A] to-[#120D2B] border border-[#3A245C] flex flex-col items-center justify-center text-center space-y-2 relative shadow-purple-subtle">

              <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest font-mono">
                Attrition Probability
              </span>

              <div className="relative flex items-center justify-center my-2">

                <div className="text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
                  {leaveProbability}%
                </div>

              </div>

              <div
                className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center space-x-2 ${riskBadge.bg}`}
              >
                <BadgeIcon className="w-4 h-4" />

                <span>
                  {employee.risk_level} ATTRITION RISK
                </span>
              </div>

            </div>

          </div>

          {/* STAY / LEAVE PROBABILITY */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* STAY */}

            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[11px] uppercase tracking-wider font-mono text-emerald-300">
                    Stay Probability
                  </p>

                  <p className="text-3xl font-bold text-emerald-300 mt-1">
                    {stayProbability}%
                  </p>

                  <p className="text-[11px] text-gray-400 mt-1">
                    Probability of employee staying
                  </p>

                </div>

                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">

                  <UserCheck className="w-6 h-6 text-emerald-400" />

                </div>

              </div>

              <div className="w-full h-2 bg-[#120B20] rounded-full mt-4 overflow-hidden">

                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${stayProbability}%`
                  }}
                />

              </div>

            </div>

            {/* LEAVE */}

            <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[11px] uppercase tracking-wider font-mono text-red-300">
                    Leave Probability
                  </p>

                  <p className="text-3xl font-bold text-red-300 mt-1">
                    {leaveProbability}%
                  </p>

                  <p className="text-[11px] text-gray-400 mt-1">
                    Probability of employee leaving
                  </p>

                </div>

                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">

                  <UserMinus className="w-6 h-6 text-red-400" />

                </div>

              </div>

              <div className="w-full h-2 bg-[#120B20] rounded-full mt-4 overflow-hidden">

                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${leaveProbability}%`
                  }}
                />

              </div>

            </div>

          </div>

          {/* EXPLAINABLE AI */}

          <div className="space-y-3">

            <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono flex items-center space-x-2">

              <Sparkles className="w-4 h-4 text-purple-400" />

              <span>
                Explainable AI (XAI) Risk Factors
              </span>

            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {employee.top_risk_factors?.map(
                (factor: any, idx: number) => (

                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#1A1030] border border-[#3A245C] space-y-1"
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-bold text-gray-200">
                        {factor.factor}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          factor.impact === 'High'
                            ? 'bg-red-950/60 text-red-300 border-red-500/30'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {factor.impact} Impact
                      </span>

                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {factor.description}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

          {/* RETENTION RECOMMENDATIONS */}

          <div className="space-y-3">

            <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono flex items-center space-x-2">

              <CheckCircle2 className="w-4 h-4 text-emerald-400" />

              <span>
                AI Retention Recommendations & Action Plan
              </span>

            </h3>

            <div className="space-y-2">

              {employee.recommendations?.map(
                (rec: any, idx: number) => (

                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#1A1030]/80 border border-[#3A245C] flex items-start space-x-3"
                  >

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded font-mono shrink-0 mt-0.5 ${
                        rec.priority === 'URGENT'
                          ? 'bg-red-900/60 text-red-300 border border-red-500/40'
                          : rec.priority === 'HIGH'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                            : 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {rec.priority}
                    </span>

                    <div>

                      <h4 className="text-xs font-semibold text-gray-200">
                        {rec.title}
                      </h4>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {rec.action}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};