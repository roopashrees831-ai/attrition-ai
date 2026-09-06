import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { predictionsApi } from '../services/api';


// ============================================================
// TYPES
// ============================================================

interface DashboardSummary {
  total_employees: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  attrition_rate: number;

  best_model_name?: string;
  best_model_accuracy?: number | null;

  risk_distribution?: any[];
  department_attrition?: any[];

  job_satisfaction_attrition?: any[];
  workload_attrition?: any[];
  top_risk_factors?: any[];
}


// ============================================================
// DASHBOARD
// ============================================================

export const Dashboard: React.FC = () => {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await predictionsApi.getDashboardSummary();

        setSummary(data);
      } catch (err) {
        console.error(
          'Failed to load dashboard:',
          err
        );

        setError(
          'Unable to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);


  // ==========================================================
  // RISK DISTRIBUTION
  // ==========================================================

  const riskData = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        name: 'High Risk',
        value: Number(
          summary.high_risk_count || 0
        ),
        color: '#FF6666'
      },
      {
        name: 'Medium Risk',
        value: Number(
          summary.medium_risk_count || 0
        ),
        color: '#FFC514'
      },
      {
        name: 'Low Risk',
        value: Number(
          summary.low_risk_count || 0
        ),
        color: '#49D17D'
      }
    ];
  }, [summary]);


  // ==========================================================
  // DEPARTMENT DATA
  // ==========================================================

  const departmentData = useMemo(() => {
    if (
      !summary?.department_attrition ||
      !Array.isArray(
        summary.department_attrition
      )
    ) {
      return [];
    }

    return summary.department_attrition.map(
      (item: any) => {
        const department =
          item.department ??
          item.name ??
          item.Department ??
          'Unknown';

        const value =
          item.high_risk ??
          item.high_risk_count ??
          item.count ??
          item.value ??
          item.attrition_count ??
          item.attrition ??
          0;

        return {
          department: String(department),
          value: Number(value || 0)
        };
      }
    );
  }, [summary]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="
          h-full
          min-h-[calc(100vh-80px)]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            w-10
            h-10
            rounded-full
            border-4
            border-purple-200
            border-t-purple-600
            animate-spin
          "
        />
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !summary) {
    return (
      <div
        className="
          h-full
          min-h-[calc(100vh-80px)]
          flex
          items-center
          justify-center
          px-6
        "
      >
        <div
          className="
            max-w-md
            w-full
            bg-white
            border
            border-red-200
            rounded-2xl
            p-6
            text-center
          "
        >
          <AlertTriangle
            className="
              w-9
              h-9
              text-red-500
              mx-auto
              mb-3
            "
          />

          <h2
            className="
              text-lg
              font-extrabold
              text-[#2D1B4E]
            "
          >
            Dashboard unavailable
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            {error ||
              'Dashboard information could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="
        w-full
        min-h-full
        bg-[#FBF9FF]
        px-7
        py-7
      "
    >
      {/* ====================================================
          TITLE
      ==================================================== */}

      <div className="mb-7">
        <div>
          <h1
            className="
              text-[28px]
              leading-tight
              font-black
              text-[#2D1B4E]
            "
          >
            Attrition Overview
          </h1>

          <p
            className="
              mt-1
              text-[15px]
              font-medium
              text-[#9A7BC2]
            "
          >
            Simple employee attrition analysis
          </p>
        </div>
      </div>


      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-5
        "
      >
        {/* TOTAL EMPLOYEES */}

        <MetricCard
          title="Total Employees"
          value={
            summary.total_employees?.toLocaleString() ??
            '0'
          }
          icon={
            <Users className="w-6 h-6" />
          }
          iconClass="
            bg-[#F0E4FF]
            text-[#8E35EA]
          "
        />


        {/* HIGH RISK */}

        <MetricCard
          title="High Risk"
          value={
            summary.high_risk_count?.toLocaleString() ??
            '0'
          }
          icon={
            <AlertTriangle className="w-6 h-6" />
          }
          iconClass="
            bg-[#FFE0E0]
            text-[#F04444]
          "
        />


        {/* LOW RISK */}

        <MetricCard
          title="Low Risk"
          value={
            summary.low_risk_count?.toLocaleString() ??
            '0'
          }
          icon={
            <ShieldCheck className="w-6 h-6" />
          }
          iconClass="
            bg-[#DDF8E8]
            text-[#18A957]
          "
        />


        {/* ATTRITION RATE */}

        <MetricCard
          title="Attrition Rate"
          value={`${Number(
            summary.attrition_rate || 0
          ).toFixed(1)}%`}
          icon={
            <TrendingUp className="w-6 h-6" />
          }
          iconClass="
            bg-[#EFE9FF]
            text-[#7C3AED]
          "
        />
      </div>


      {/* ====================================================
          CHARTS
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-5
          mt-6
        "
      >
        {/* ==================================================
            RISK DISTRIBUTION
        ================================================== */}

        <div
          className="
            bg-white
            border
            border-[#E6DBF7]
            rounded-[18px]
            min-h-[405px]
            p-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <PieChartIcon
              className="
                w-5
                h-5
                text-[#9B3EFF]
              "
            />

            <h2
              className="
                text-[16px]
                font-extrabold
                text-[#2D1B4E]
              "
            >
              Employee Risk Distribution
            </h2>
          </div>


          <div
            className="
              h-[285px]
              mt-4
            "
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={1}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {riskData.map(
                    (entry, index) => (
                      <Cell
                        key={`risk-${index}`}
                        fill={entry.color}
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value: any) => [
                    Number(
                      value
                    ).toLocaleString(),
                    'Employees'
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border:
                      '1px solid #E7DBF7',
                    boxShadow:
                      '0 8px 24px rgba(60,30,100,0.08)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>


          {/* LEGEND */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-5
              text-sm
              font-medium
              text-[#654B8C]
            "
          >
            {riskData.map(
              (item) => (
                <div
                  key={item.name}
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      block
                      w-3
                      h-3
                      rounded-full
                    "
                    style={{
                      backgroundColor:
                        item.color
                    }}
                  />

                  <span>
                    {item.name}
                  </span>
                </div>
              )
            )}
          </div>
        </div>


        {/* ==================================================
            HIGH RISK BY DEPARTMENT
        ================================================== */}

        <div
          className="
            bg-white
            border
            border-[#E6DBF7]
            rounded-[18px]
            min-h-[405px]
            p-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <BarChart3
              className="
                w-5
                h-5
                text-[#9B3EFF]
              "
            />

            <h2
              className="
                text-[16px]
                font-extrabold
                text-[#2D1B4E]
              "
            >
              High Risk by Department
            </h2>
          </div>


          <div
            className="
              h-[320px]
              mt-5
            "
          >
            {departmentData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={departmentData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 10
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#EEE7F8"
                    vertical
                  />

                  <XAxis
                    dataKey="department"
                    tick={{
                      fill: '#9275B5',
                      fontSize: 12
                    }}
                    axisLine={{
                      stroke: '#A787CE'
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: '#9275B5',
                      fontSize: 12
                    }}
                    axisLine={{
                      stroke: '#A787CE'
                    }}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value: any) => [
                      Number(
                        value
                      ).toLocaleString(),
                      'High Risk'
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border:
                        '1px solid #E7DBF7'
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#9B7DEA"
                    radius={[
                      8,
                      8,
                      0,
                      0
                    ]}
                    maxBarSize={84}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="
                  h-full
                  flex
                  items-center
                  justify-center
                  text-sm
                  font-medium
                  text-slate-400
                "
              >
                No department risk data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// METRIC CARD
// ============================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
}


const MetricCard: React.FC<
  MetricCardProps
> = ({
  title,
  value,
  icon,
  iconClass
}) => {
  return (
    <div
      className="
        min-h-[108px]
        bg-white
        border
        border-[#E6DBF7]
        rounded-[17px]
        px-5
        py-4
        flex
        items-center
        justify-between
      "
    >
      <div>
        <p
          className="
            text-[13px]
            font-medium
            text-[#705F85]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-2
            text-[27px]
            leading-none
            font-black
            text-[#20123F]
          "
        >
          {value}
        </p>
      </div>


      <div
        className={`
          w-12
          h-12
          rounded-xl
          flex
          items-center
          justify-center
          ${iconClass}
        `}
      >
        {icon}
      </div>
    </div>
  );
};


export default Dashboard;