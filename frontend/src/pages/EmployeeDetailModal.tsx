import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  X,
  User,
  BriefcaseBusiness,
  Building2,
  IndianRupee,
  Clock3,
  BrainCircuit,
  Lightbulb,
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles
} from 'lucide-react';

import { predictionsApi } from '../services/api';

interface Props {
  employee: any;
  onClose: () => void;
}

type RawData = Record<string, any>;

/* =========================================================
   HELPERS
========================================================= */

const clean = (value: any) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value)
    .replace(/\u00a0/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseRawData = (
  employee: any
): RawData => {
  if (!employee?.raw_data) {
    return {};
  }

  if (
    typeof employee.raw_data ===
    'object'
  ) {
    return employee.raw_data;
  }

  try {
    return JSON.parse(
      employee.raw_data
    );
  } catch {
    return {};
  }
};

const findKey = (
  raw: RawData,
  aliases: string[]
) => {
  const keys = Object.keys(raw);

  for (const alias of aliases) {
    const wanted =
      normalize(alias);

    const match =
      keys.find(
        (key) =>
          normalize(key) ===
          wanted
      );

    if (match) {
      return match;
    }
  }

  return undefined;
};

const getValue = (
  raw: RawData,
  aliases: string[],
  fallback: any = ''
) => {
  const key =
    findKey(
      raw,
      aliases
    );

  return key
    ? raw[key]
    : fallback;
};

const setValue = (
  raw: RawData,
  aliases: string[],
  preferredKey: string,
  value: any
) => {
  const key =
    findKey(
      raw,
      aliases
    ) ||
    preferredKey;

  raw[key] = value;
};

const toNumber = (
  value: any,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
};

const pct = (
  value: number
) => {
  const safe =
    Math.max(
      0,
      Math.min(
        1,
        value
      )
    );

  return `${(
    safe * 100
  ).toFixed(1)}%`;
};

const prettyName = (
  value: string
) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(
      /([a-z])([A-Z])/g,
      '$1 $2'
    )
    .replace(/\s+/g, ' ')
    .trim();

const riskFromProbability = (
  probability: number
) => {
  if (
    probability >= 0.65
  ) {
    return 'HIGH';
  }

  if (
    probability >= 0.35
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
};

/* =========================================================
   NOVATECH DATASET CATEGORIES
========================================================= */

const NOVATECH_WLB = [
  'Difficult',
  'Medium',
  'Easy'
];

const NOVATECH_JOB_SAT = [
  'Not satisfied',
  'Satisfied',
  'Very satisfied'
];

/*
   IMPORTANT

   label = what USER sees
   value = what MODEL receives

   Never send the rupee amount to the model.
   Gradient Boosting was trained using the original
   categorical salary bands.
*/

const NOVATECH_SALARY_OPTIONS = [
  {
    label: '₹1,00,000',
    value: 'Less than 5000 SAR'
  },
  {
    label: '₹1,90,000',
    value: 'From 5000 to 10000 S.R'
  },
  {
    label: '₹3,30,000',
    value: 'From 11000 to 15000 S.R'
  },
  {
    label: '₹4,60,000',
    value: 'From 16000 to 20000 S.R'
  },
  {
    label: '₹5,80,000',
    value: 'From 21000 to 25000 S.R'
  },
  {
    label: '₹7,10,000',
    value: 'From 26000 to 30000 S.R'
  },
  {
    label: '₹8,10,000+',
    value: 'S.R 31000 - and more'
  }
];

const withCurrent = (
  values: string[],
  current: string
) => {
  if (!current) {
    return values;
  }

  const exists =
    values.some(
      (item) =>
        clean(item)
          .toLowerCase() ===
        clean(current)
          .toLowerCase()
    );

  return exists
    ? values
    : [
        current,
        ...values
      ];
};

const novatechSalaryDisplay = (
  originalBand: string
) => {
  const found =
    NOVATECH_SALARY_OPTIONS.find(
      (item) =>
        clean(
          item.value
        ).toLowerCase() ===
        clean(
          originalBand
        ).toLowerCase()
    );

  return found
    ? found.label
    : originalBand || '—';
};

/* =========================================================
   COLOR LOGIC
========================================================= */

const getRiskColors = (
  risk: string
) => {
  const value =
    String(risk || '')
      .toUpperCase();

  /* HIGH = RED */

  if (value === 'HIGH') {
    return {
      text:
        'text-[#FF4D4F]',
      border:
        'border-[#FF4D4F]/35',
      bg:
        'bg-[#FF4D4F]/10'
    };
  }

  /* MEDIUM = YELLOW / ORANGE */

  if (
    value === 'MEDIUM'
  ) {
    return {
      text:
        'text-[#FFB020]',
      border:
        'border-[#F59E0B]/40',
      bg:
        'bg-[#F59E0B]/10'
    };
  }

  /* LOW = GREEN */

  return {
    text:
      'text-[#28D17C]',
    border:
      'border-[#22C55E]/35',
    bg:
      'bg-[#22C55E]/10'
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export const EmployeeDetailModal:
React.FC<Props> = ({
  employee,
  onClose
}) => {
  const scrollBodyRef =
    useRef<HTMLDivElement>(
      null
    );

  const resultRef =
    useRef<HTMLDivElement>(
      null
    );

  const rawData =
    useMemo(
      () =>
        parseRawData(
          employee
        ),
      [employee]
    );

  /* =======================================================
     DETECT NOVATECH DATASET
  ======================================================= */

  const isNovaTech =
    useMemo(() => {
      const keys =
        Object.keys(
          rawData
        ).map(
          normalize
        );

      return (
        keys.includes(
          normalize(
            'MonthlySalary'
          )
        ) ||
        keys.includes(
          normalize(
            'Work_Live_Balance'
          )
        ) ||
        keys.includes(
          normalize(
            'Job_Opportunities'
          )
        )
      );
    }, [rawData]);

  /* =======================================================
     EMPLOYEE DETAILS
  ======================================================= */

  const employeeId =
    clean(
      getValue(
        rawData,
        [
          'ID',
          'EmployeeNumber',
          'EmployeeID'
        ],
        employee
          ?.employee_id ??
        employee
          ?.id ??
        '—'
      )
    );

  const department =
    clean(
      getValue(
        rawData,
        [
          'Department'
        ],
        employee
          ?.department ??
        '—'
      )
    );

  const role =
    clean(
      getValue(
        rawData,
        [
          'JobTitle',
          'JobRole',
          'Job Role',
          'Role'
        ],
        employee
          ?.job_role ??
        'Employee'
      )
    );

  const sector =
    clean(
      getValue(
        rawData,
        [
          'Sector'
        ],
        '—'
      )
    );

  const performanceRating =
    clean(
      getValue(
        rawData,
        [
          'PerformanceRating',
          'AppraisalRating'
        ],
        '—'
      )
    );

  const experience =
    clean(
      getValue(
        rawData,
        [
          'Years_Experience',
          'YearsAtCompany',
          'YearsWithCompany',
          'TotalWorkingYears'
        ],
        employee
          ?.years_at_company ??
        '—'
      )
    );

  const originalOvertime =
    clean(
      getValue(
        rawData,
        [
          'OverTime',
          'Overtime'
        ],
        employee
          ?.overtime ??
        'No'
      )
    ) || 'No';

  const originalWlb =
    clean(
      getValue(
        rawData,
        [
          'Work_Live_Balance',
          'WorkLifeBalance',
          'Work_Life_Balance',
          'Work Life Balance'
        ],
        isNovaTech
          ? 'Medium'
          : employee
              ?.work_life_balance ??
            3
      )
    );

  const originalSat =
    clean(
      getValue(
        rawData,
        [
          'Job_Satisfaction',
          'JobSatisfaction',
          'Job Satisfaction'
        ],
        isNovaTech
          ? 'Satisfied'
          : employee
              ?.job_satisfaction ??
            3
      )
    );

  /*
     For NovaTech this remains the ORIGINAL salary category.
     Example:
     From 5000 to 10000 S.R

     It is NOT converted before prediction.
  */

  const originalSalary =
    clean(
      getValue(
        rawData,
        [
          'MonthlySalary',
          'MonthlyIncome',
          'Monthly Income',
          'Salary'
        ],
        employee
          ?.monthly_income ??
        ''
      )
    );

  /*
     Only the NovaTech display version becomes ₹.
  */

  const displayedSalary =
    isNovaTech
      ? novatechSalaryDisplay(
          originalSalary
        )
      : originalSalary;

  /* =======================================================
     GET FRESH REAL PREDICTION
  ======================================================= */

  const [
    livePrediction,
    setLivePrediction
  ] =
    useState<any>(
      null
    );

  const [
    predictionLoading,
    setPredictionLoading
  ] =
    useState(false);

  useEffect(() => {
    let active = true;

    const loadPrediction =
      async () => {
        if (
          Object.keys(
            rawData
          ).length === 0
        ) {
          return;
        }

        try {
          setPredictionLoading(
            true
          );

          const result =
            await predictionsApi
              .predictSingle({
                ...rawData
              });

          if (active) {
            setLivePrediction(
              result
            );
          }
        } catch (
          error
        ) {
          console.error(
            'Prediction refresh failed:',
            error
          );

          if (active) {
            setLivePrediction(
              null
            );
          }
        } finally {
          if (active) {
            setPredictionLoading(
              false
            );
          }
        }
      };

    loadPrediction();

    return () => {
      active = false;
    };
  }, [rawData]);

  const currentProbability =
    Math.max(
      0,
      Math.min(
        1,
        toNumber(
          livePrediction
            ?.probability ??
          employee
            ?.probability,
          0
        )
      )
    );

  const currentRisk =
    String(
      livePrediction
        ?.risk_level ??
      employee
        ?.risk_level ??
      riskFromProbability(
        currentProbability
      )
    ).toUpperCase();

  const currentColors =
    getRiskColors(
      currentRisk
    );

  /* =======================================================
     WHAT-IF STATE
  ======================================================= */

  const [
    overtime,
    setOvertime
  ] =
    useState(
      originalOvertime
    );

  const [
    wlb,
    setWlb
  ] =
    useState(
      originalWlb
    );

  const [
    satisfaction,
    setSatisfaction
  ] =
    useState(
      originalSat
    );

  /*
     salary state stores ORIGINAL salary category,
     NOT ₹ amount.
  */

  const [
    salary,
    setSalary
  ] =
    useState(
      originalSalary
    );

  const [
    whatIfResult,
    setWhatIfResult
  ] =
    useState<any>(
      null
    );

  const [
    running,
    setRunning
  ] =
    useState(false);

  const [
    error,
    setError
  ] =
    useState('');

  /* =======================================================
     RESET WHEN EMPLOYEE CHANGES
  ======================================================= */

  useEffect(() => {
    setOvertime(
      originalOvertime
    );

    setWlb(
      originalWlb
    );

    setSatisfaction(
      originalSat
    );

    setSalary(
      originalSalary
    );

    setWhatIfResult(
      null
    );

    setError('');

    requestAnimationFrame(
      () => {
        scrollBodyRef
          .current
          ?.scrollTo({
            top: 0,
            behavior:
              'smooth'
          });
      }
    );
  }, [
    employee,
    originalOvertime,
    originalWlb,
    originalSat,
    originalSalary
  ]);

  /* =======================================================
     SCENARIO CHANGES
  ======================================================= */

  const changes =
    useMemo(() => {
      const result:
        string[] = [];

      if (
        clean(
          overtime
        ) !==
        clean(
          originalOvertime
        )
      ) {
        result.push(
          `Overtime: ${originalOvertime} → ${overtime}`
        );
      }

      if (
        clean(
          wlb
        ) !==
        clean(
          originalWlb
        )
      ) {
        result.push(
          `Work-Life Balance: ${originalWlb} → ${wlb}`
        );
      }

      if (
        clean(
          satisfaction
        ) !==
        clean(
          originalSat
        )
      ) {
        result.push(
          `Job Satisfaction: ${originalSat} → ${satisfaction}`
        );
      }

      if (
        clean(
          salary
        ) !==
        clean(
          originalSalary
        )
      ) {
        const before =
          isNovaTech
            ? novatechSalaryDisplay(
                originalSalary
              )
            : originalSalary;

        const after =
          isNovaTech
            ? novatechSalaryDisplay(
                salary
              )
            : salary;

        result.push(
          `${isNovaTech ? 'Monthly Salary' : 'Monthly Income'}: ${before} → ${after}`
        );
      }

      return result;
    }, [
      overtime,
      wlb,
      satisfaction,
      salary,
      originalOvertime,
      originalWlb,
      originalSat,
      originalSalary,
      isNovaTech
    ]);

  /* =======================================================
     RESET SCENARIO
  ======================================================= */

  const resetScenario =
    () => {
      setOvertime(
        originalOvertime
      );

      setWlb(
        originalWlb
      );

      setSatisfaction(
        originalSat
      );

      setSalary(
        originalSalary
      );

      setWhatIfResult(
        null
      );

      setError('');
    };

  /* =======================================================
     RUN WHAT-IF
  ======================================================= */

  const runWhatIf =
    async () => {
      try {
        setRunning(
          true
        );

        setError('');

        setWhatIfResult(
          null
        );

        const scenario:
          RawData = {
          ...rawData
        };

        /*
           OVERTIME
        */

        setValue(
          scenario,
          [
            'OverTime',
            'Overtime'
          ],
          'OverTime',
          overtime
        );

        if (
          isNovaTech
        ) {
          /*
             IMPORTANT:
             Send exact categorical values
             used during model training.
          */

          setValue(
            scenario,
            [
              'Work_Live_Balance'
            ],
            'Work_Live_Balance',
            wlb
          );

          setValue(
            scenario,
            [
              'Job_Satisfaction'
            ],
            'Job_Satisfaction',
            satisfaction
          );

          /*
             salary variable contains:
             From 5000 to 10000 S.R

             NOT ₹1,90,000
          */

          setValue(
            scenario,
            [
              'MonthlySalary'
            ],
            'MonthlySalary',
            salary
          );
        } else {
          /*
             IBM / LAVENDER NUMERIC DATASET
          */

          setValue(
            scenario,
            [
              'WorkLifeBalance',
              'Work_Life_Balance'
            ],
            'WorkLifeBalance',
            Number(
              wlb
            )
          );

          setValue(
            scenario,
            [
              'JobSatisfaction',
              'Job_Satisfaction'
            ],
            'JobSatisfaction',
            Number(
              satisfaction
            )
          );

          setValue(
            scenario,
            [
              'MonthlyIncome',
              'Salary'
            ],
            'MonthlyIncome',
            Number(
              salary
            )
          );
        }

        /*
           REAL MODEL API CALL
        */

        const result =
          await predictionsApi
            .predictSingle(
              scenario
            );

        setWhatIfResult(
          result
        );

        requestAnimationFrame(
          () => {
            requestAnimationFrame(
              () => {
                resultRef
                  .current
                  ?.scrollIntoView({
                    behavior:
                      'smooth',
                    block:
                      'start'
                  });
              }
            );
          }
        );
      } catch (
        err: any
      ) {
        console.error(
          err
        );

        setError(
          err
            ?.response
            ?.data
            ?.detail ||
          err?.message ||
          'Unable to run what-if prediction.'
        );
      } finally {
        setRunning(
          false
        );
      }
    };

  /* =======================================================
     WHY THIS PREDICTION
  ======================================================= */

  const whyPoints =
    Array.isArray(
      livePrediction
        ?.local_explanations
    )
      ? livePrediction
          .local_explanations

      : Array.isArray(
          employee
            ?.local_explanations
        )
      ? employee
          .local_explanations

      : [];

  /* =======================================================
     WHAT-IF RESULT
  ======================================================= */

  const scenarioProbability =
    whatIfResult
      ? Math.max(
          0,
          Math.min(
            1,
            toNumber(
              whatIfResult
                ?.probability,
              currentProbability
            )
          )
        )
      : null;

  const scenarioRisk =
    scenarioProbability !==
    null
      ? String(
          whatIfResult
            ?.risk_level ??
          riskFromProbability(
            scenarioProbability
          )
        ).toUpperCase()
      : '';

  const scenarioColors =
    getRiskColors(
      scenarioRisk
    );

  const difference =
    scenarioProbability !==
    null
      ? (
          scenarioProbability -
          currentProbability
        ) * 100
      : 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        backdrop-blur-sm
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-6xl
          h-[92vh]
          bg-[#08050D]
          border
          border-[#392349]
          rounded-[26px]
          shadow-[0_30px_100px_rgba(50,15,80,.45)]
          overflow-hidden
          flex
          flex-col
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            justify-between
            items-center
            px-7
            py-5
            bg-[#15091E]
            border-b
            border-[#3B2150]
          "
        >
          <div>
            <h2
              className="
                text-2xl
                font-extrabold
                text-white
                font-['Outfit']
              "
            >
              Employee Prediction Result
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[#C687F7]
              "
            >
              Employee {employeeId}
            </p>
          </div>

          <button
            onClick={
              onClose
            }
            className="
              p-2
              rounded-xl
              text-[#C9A2DE]
              hover:text-white
              hover:bg-[#2A1536]
              transition
            "
          >
            <X
              className="
                w-5
                h-5
              "
            />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div
          ref={
            scrollBodyRef
          }
          className="
            flex-1
            overflow-y-auto
            px-7
            py-7
            space-y-9
          "
        >

          {/* =================================================
              EMPLOYEE DETAILS
          ================================================= */}

          <section>
            <h3
              className="
                text-xl
                font-bold
                text-white
                mb-4
              "
            >
              Employee Details
            </h3>

            <div
              className="
                grid
                grid-cols-2
                lg:grid-cols-4
                gap-3
              "
            >
              <DetailCard
                icon={
                  <User className="w-4 h-4" />
                }
                label="Employee ID"
                value={
                  employeeId
                }
              />

              <DetailCard
                icon={
                  <Building2 className="w-4 h-4" />
                }
                label="Department"
                value={
                  department
                }
              />

              <DetailCard
                icon={
                  <BriefcaseBusiness className="w-4 h-4" />
                }
                label="Job Title"
                value={
                  role
                }
              />

              <DetailCard
                icon={
                  <Building2 className="w-4 h-4" />
                }
                label={
                  isNovaTech
                    ? 'Sector'
                    : 'Performance Rating'
                }
                value={
                  isNovaTech
                    ? sector
                    : performanceRating
                }
              />

              <DetailCard
                icon={
                  <Clock3 className="w-4 h-4" />
                }
                label={
                  isNovaTech
                    ? 'Experience'
                    : 'Years at Company'
                }
                value={
                  experience
                }
              />

              <DetailCard
                icon={
                  <IndianRupee className="w-4 h-4" />
                }
                label={
                  isNovaTech
                    ? 'Monthly Salary'
                    : 'Monthly Income'
                }
                value={
                  displayedSalary
                }
              />

              <DetailCard
                icon={
                  <Clock3 className="w-4 h-4" />
                }
                label="Overtime"
                value={
                  originalOvertime
                }
              />

              <DetailCard
                icon={
                  <Sparkles className="w-4 h-4" />
                }
                label="Work-Life Balance"
                value={
                  originalWlb
                }
              />
            </div>
          </section>

          {/* =================================================
              PREDICTION
          ================================================= */}

          <section>
            <SectionHeader
              icon={
                <BrainCircuit className="w-6 h-6" />
              }
              title="Prediction"
            />

            <p
              className="
                text-xs
                text-[#9E8AA9]
                mb-5
              "
            >
              Prediction generated by the trained employee attrition model.
            </p>

            <div
              className="
                grid
                md:grid-cols-3
                gap-4
              "
            >

              {/* LEAVE = RED */}

              <div
                className="
                  rounded-2xl
                  p-5
                  border
                  border-[#FF3B3B]/35
                  bg-gradient-to-br
                  from-[#2B1014]
                  to-[#16090C]
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                    text-[#FF7A7A]
                  "
                >
                  Leave Probability
                </p>

                <div
                  className="
                    text-4xl
                    font-black
                    text-[#FF4141]
                    mt-3
                  "
                >
                  {pct(
                    currentProbability
                  )}
                </div>

                <div
                  className="
                    h-2
                    rounded-full
                    bg-[#351215]
                    mt-4
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-[#FF2828]
                      to-[#FF6868]
                    "
                    style={{
                      width:
                        `${currentProbability * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* STAY = GREEN */}

              <div
                className="
                  rounded-2xl
                  p-5
                  border
                  border-[#22C55E]/35
                  bg-gradient-to-br
                  from-[#0C2417]
                  to-[#08140E]
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                    text-[#66E79B]
                  "
                >
                  Stay Probability
                </p>

                <div
                  className="
                    text-4xl
                    font-black
                    text-[#2ADB79]
                    mt-3
                  "
                >
                  {pct(
                    1 -
                    currentProbability
                  )}
                </div>

                <div
                  className="
                    h-2
                    rounded-full
                    bg-[#10331E]
                    mt-4
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-[#1FBE59]
                      to-[#45E28A]
                    "
                    style={{
                      width:
                        `${(1 - currentProbability) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* RISK */}

              <div
                className={`
                  rounded-2xl
                  p-5
                  border
                  ${currentColors.border}
                  ${currentColors.bg}
                `}
              >
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    font-black
                    text-[#D3B5DF]
                  "
                >
                  Risk Level
                </p>

                <div
                  className={`
                    inline-flex
                    mt-5
                    px-5
                    py-2.5
                    rounded-xl
                    border
                    text-sm
                    font-black
                    ${currentColors.text}
                    ${currentColors.border}
                    ${currentColors.bg}
                  `}
                >
                  {predictionLoading
                    ? 'ANALYZING'
                    : currentRisk}
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              WHY THIS PREDICTION
          ================================================= */}

          <section>
            <div
              className="
                flex
                items-center
                gap-3
                mb-2
              "
            >
              <Lightbulb
                className="
                  w-6
                  h-6
                  text-[#F59E0B]
                "
              />

              <h3
                className="
                  text-xl
                  font-black
                  text-white
                "
              >
                Why This Prediction?
              </h3>

              <div
                className="
                  h-px
                  flex-1
                  bg-gradient-to-r
                  from-[#F59E0B]/40
                  to-transparent
                "
              />
            </div>

            <p
              className="
                text-xs
                text-[#9F8DAA]
                mb-4
              "
            >
              Employee-specific model sensitivity. These points explain model behaviour, not guaranteed causes.
            </p>

            <div
              className="
                space-y-3
              "
            >
              {whyPoints.length >
              0 ? (
                whyPoints
                  .slice(0, 4)
                  .map(
                    (
                      item: any,
                      index: number
                    ) => {
                      const impact =
                        toNumber(
                          item
                            ?.probability_point_impact,
                          0
                        );

                      const increasesRisk =
                        impact > 0;

                      const reducesRisk =
                        impact < 0;

                      return (
                        <div
                          key={
                            index
                          }
                          className={`
                            flex
                            gap-4
                            items-start
                            rounded-2xl
                            border
                            p-4
                            ${
                              increasesRisk
                                ? `
                                  border-[#FF4D4F]/25
                                  bg-[#211014]
                                `
                                : reducesRisk
                                ? `
                                  border-[#22C55E]/25
                                  bg-[#0C2015]
                                `
                                : `
                                  border-[#F59E0B]/25
                                  bg-[#21180C]
                                `
                            }
                          `}
                        >
                          <div
                            className={`
                              w-10
                              h-10
                              shrink-0
                              rounded-xl
                              flex
                              items-center
                              justify-center
                              border
                              ${
                                increasesRisk
                                  ? `
                                    bg-[#321218]
                                    border-[#FF4D4F]/30
                                  `
                                  : reducesRisk
                                  ? `
                                    bg-[#0C2B1A]
                                    border-[#22C55E]/30
                                  `
                                  : `
                                    bg-[#32240D]
                                    border-[#F59E0B]/30
                                  `
                              }
                            `}
                          >
                            {increasesRisk ? (
                              <TrendingUp
                                className="
                                  w-5
                                  h-5
                                  text-[#FF5757]
                                "
                              />
                            ) : reducesRisk ? (
                              <TrendingDown
                                className="
                                  w-5
                                  h-5
                                  text-[#34D97C]
                                "
                              />
                            ) : (
                              <Minus
                                className="
                                  w-5
                                  h-5
                                  text-[#FFB020]
                                "
                              />
                            )}
                          </div>

                          <div
                            className="
                              flex-1
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-3
                              "
                            >
                              <div
                                className="
                                  text-sm
                                  font-bold
                                  text-white
                                "
                              >
                                {prettyName(
                                  item
                                    ?.feature ??
                                  'Model Factor'
                                )}
                              </div>

                              <span
                                className={`
                                  px-3
                                  py-1
                                  rounded-lg
                                  border
                                  text-xs
                                  font-black
                                  ${
                                    increasesRisk
                                      ? `
                                        text-[#FF6A6A]
                                        border-[#FF4D4F]/30
                                        bg-[#FF4D4F]/10
                                      `
                                      : reducesRisk
                                      ? `
                                        text-[#42E28A]
                                        border-[#22C55E]/30
                                        bg-[#22C55E]/10
                                      `
                                      : `
                                        text-[#FFB020]
                                        border-[#F59E0B]/30
                                        bg-[#F59E0B]/10
                                      `
                                  }
                                `}
                              >
                                {impact >
                                0
                                  ? '+'
                                  : ''}
                                {impact.toFixed(
                                  2
                                )}{' '}
                                pp
                              </span>
                            </div>

                            <div
                              className="
                                text-xs
                                text-[#AE9BB6]
                                mt-2
                                leading-relaxed
                              "
                            >
                              Current value{' '}

                              <b className="text-white">
                                {clean(
                                  item
                                    ?.input_value
                                ) ||
                                  '—'}
                              </b>

                              {' '}compared with reference{' '}

                              <b className="text-white">
                                {clean(
                                  item
                                    ?.reference_value
                                ) ||
                                  '—'}
                              </b>

                              {' '}makes the model estimate{' '}

                              <span
                                className={
                                  increasesRisk
                                    ? 'text-[#FF6262] font-bold'
                                    : reducesRisk
                                    ? 'text-[#42E28A] font-bold'
                                    : 'text-[#FFB020] font-bold'
                                }
                              >
                                {increasesRisk
                                  ? 'higher'
                                  : reducesRisk
                                  ? 'lower'
                                  : 'almost unchanged'}
                              </span>
                              .
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
              ) : (
                <div
                  className="
                    rounded-2xl
                    border
                    border-[#F59E0B]/25
                    bg-[#1B140B]
                    p-4
                    text-sm
                    text-[#D7B470]
                  "
                >
                  {predictionLoading
                    ? 'Analyzing employee-specific model factors...'
                    : 'No additional employee-specific sensitivity points were returned.'}
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              WHAT-IF SCENARIO
          ================================================= */}

          <section>
            <div
              className="
                flex
                justify-between
                items-center
                gap-4
                mb-4
              "
            >
              <div>
                <div
                  className="
                    flex
                    gap-3
                    items-center
                  "
                >
                  <SlidersHorizontal
                    className="
                      w-6
                      h-6
                      text-[#A855F7]
                    "
                  />

                  <h3
                    className="
                      text-xl
                      font-black
                      text-white
                    "
                  >
                    What-If Scenario
                  </h3>
                </div>

                <p
                  className="
                    text-xs
                    text-[#9D8AA8]
                    mt-2
                  "
                >
                  Change workplace factors and rerun the same trained model.
                </p>
              </div>

              <button
                onClick={
                  resetScenario
                }
                className="
                  flex
                  gap-2
                  items-center
                  px-4
                  py-2
                  rounded-xl
                  border
                  border-[#65368A]
                  text-[#D29AF4]
                  hover:bg-[#24132F]
                "
              >
                <RotateCcw
                  className="
                    w-4
                    h-4
                  "
                />

                Reset
              </button>
            </div>

            <div
              className="
                grid
                md:grid-cols-2
                gap-4
              "
            >

              {/* OVERTIME */}

              <ControlCard
                title="Overtime"
                current={
                  originalOvertime
                }
              >
                <select
                  value={
                    overtime
                  }
                  onChange={(
                    event
                  ) =>
                    setOvertime(
                      event
                        .target
                        .value
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  <option value="No">
                    No
                  </option>

                  <option value="Yes">
                    Yes
                  </option>
                </select>
              </ControlCard>

              {/* WLB */}

              <ControlCard
                title="Work-Life Balance"
                current={
                  originalWlb
                }
              >
                <select
                  value={
                    wlb
                  }
                  onChange={(
                    event
                  ) =>
                    setWlb(
                      event
                        .target
                        .value
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  {isNovaTech ? (
                    withCurrent(
                      NOVATECH_WLB,
                      originalWlb
                    ).map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {option}
                        </option>
                      )
                    )
                  ) : (
                    <>
                      <option value="1">
                        1 - Low
                      </option>

                      <option value="2">
                        2
                      </option>

                      <option value="3">
                        3
                      </option>

                      <option value="4">
                        4 - High
                      </option>
                    </>
                  )}
                </select>
              </ControlCard>

              {/* JOB SATISFACTION */}

              <ControlCard
                title="Job Satisfaction"
                current={
                  originalSat
                }
              >
                <select
                  value={
                    satisfaction
                  }
                  onChange={(
                    event
                  ) =>
                    setSatisfaction(
                      event
                        .target
                        .value
                    )
                  }
                  className={
                    inputStyle
                  }
                >
                  {isNovaTech ? (
                    withCurrent(
                      NOVATECH_JOB_SAT,
                      originalSat
                    ).map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {option}
                        </option>
                      )
                    )
                  ) : (
                    <>
                      <option value="1">
                        1 - Low
                      </option>

                      <option value="2">
                        2
                      </option>

                      <option value="3">
                        3
                      </option>

                      <option value="4">
                        4 - High
                      </option>
                    </>
                  )}
                </select>
              </ControlCard>

              {/* MONTHLY SALARY */}

              <ControlCard
                title={
                  isNovaTech
                    ? 'Monthly Salary'
                    : 'Monthly Income'
                }
                current={
                  displayedSalary
                }
              >
                {isNovaTech ? (
                  <select
                    value={
                      salary
                    }
                    onChange={(
                      event
                    ) =>
                      setSalary(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputStyle
                    }
                  >
                    {NOVATECH_SALARY_OPTIONS.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={
                      salary
                    }
                    onChange={(
                      event
                    ) =>
                      setSalary(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputStyle
                    }
                  />
                )}
              </ControlCard>
            </div>

            {/* =============================================
                SCENARIO CHANGES
            ============================================= */}

            <div
              className="
                mt-4
                rounded-2xl
                border
                border-[#4F296D]
                bg-[#21102D]
                p-4
              "
            >
              <div
                className="
                  text-xs
                  font-bold
                  text-[#CE93F9]
                  uppercase
                  mb-3
                "
              >
                Scenario Changes
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {changes.length >
                0 ? (
                  changes.map(
                    (
                      item,
                      index
                    ) => (
                      <span
                        key={
                          index
                        }
                        className="
                          px-3
                          py-2
                          rounded-xl
                          bg-[#160A20]
                          border
                          border-[#5F347C]
                          text-xs
                          font-semibold
                          text-[#E0B6FA]
                        "
                      >
                        {item}
                      </span>
                    )
                  )
                ) : (
                  <span
                    className="
                      text-xs
                      text-[#9887A0]
                    "
                  >
                    No changes selected.
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-[#FF4D4F]/35
                  bg-[#FF4D4F]/10
                  p-3
                  text-[#FF7475]
                  text-sm
                "
              >
                {error}
              </div>
            )}

            <button
              onClick={
                runWhatIf
              }
              disabled={
                running
              }
              className="
                w-full
                mt-4
                h-14
                rounded-xl
                font-black
                text-white
                bg-gradient-to-r
                from-[#6D28D9]
                via-[#9333EA]
                to-[#C026D3]
                hover:brightness-110
                disabled:opacity-50
                transition
                flex
                justify-center
                items-center
                gap-3
              "
            >
              {running
                ? 'Running Model...'
                : 'Run What-If Scenario'}

              {!running && (
                <ArrowRight
                  className="
                    w-5
                    h-5
                  "
                />
              )}
            </button>
          </section>

          {/* =================================================
              WHAT-IF RESULT
          ================================================= */}

          {whatIfResult &&
            scenarioProbability !==
              null && (
              <section
                ref={
                  resultRef
                }
                className="
                  scroll-mt-4
                "
              >
                <SectionHeader
                  icon={
                    <BrainCircuit className="w-6 h-6" />
                  }
                  title="What-If Result"
                />

                {changes.length >
                  0 && (
                  <div
                    className="
                      mb-4
                      text-xs
                      text-[#A997B2]
                    "
                  >
                    Scenario:{' '}

                    <span
                      className="
                        text-[#D9B9EA]
                        font-semibold
                      "
                    >
                      {changes.join(
                        ' • '
                      )}
                    </span>
                  </div>
                )}

                <div
                  className="
                    grid
                    md:grid-cols-2
                    gap-4
                  "
                >
                  <ResultCard
                    title="Current Prediction"
                    probability={
                      currentProbability
                    }
                    risk={
                      currentRisk
                    }
                    colors={
                      currentColors
                    }
                  />

                  <ResultCard
                    title="What-If Prediction"
                    probability={
                      scenarioProbability
                    }
                    risk={
                      scenarioRisk
                    }
                    colors={
                      scenarioColors
                    }
                  />
                </div>

                {/* ===========================================
                    PROBABILITY DIFFERENCE
                =========================================== */}

                <div
                  className={`
                    mt-4
                    rounded-2xl
                    border
                    p-5
                    flex
                    gap-4
                    items-center
                    ${
                      difference <
                      0
                        ? `
                          border-[#22C55E]/35
                          bg-[#0B2115]
                        `
                        : difference >
                          0
                        ? `
                          border-[#FF4D4F]/35
                          bg-[#261012]
                        `
                        : `
                          border-[#F59E0B]/35
                          bg-[#241B0B]
                        `
                    }
                  `}
                >
                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      flex
                      justify-center
                      items-center
                      bg-[#0B080D]
                    "
                  >
                    {difference <
                    0 ? (
                      <TrendingDown
                        className="
                          text-[#34D97C]
                        "
                      />
                    ) : difference >
                      0 ? (
                      <TrendingUp
                        className="
                          text-[#FF5757]
                        "
                      />
                    ) : (
                      <Minus
                        className="
                          text-[#FFB020]
                        "
                      />
                    )}
                  </div>

                  <div>
                    <div
                      className="
                        font-black
                        text-white
                      "
                    >
                      Probability Difference
                    </div>

                    <div
                      className="
                        text-sm
                        text-[#AC99B4]
                        mt-1
                      "
                    >
                      Leave probability{' '}

                      <span
                        className={
                          difference <
                          0
                            ? 'text-[#34D97C] font-black'
                            : difference >
                              0
                            ? 'text-[#FF5757] font-black'
                            : 'text-[#FFB020] font-black'
                        }
                      >
                        {difference <
                        0
                          ? 'decreased'
                          : difference >
                            0
                          ? 'increased'
                          : 'remained unchanged'}
                      </span>

                      {' '}by{' '}

                      <span
                        className="
                          font-black
                          text-white
                        "
                      >
                        {Math.abs(
                          difference
                        ).toFixed(
                          2
                        )}{' '}
                        percentage points
                      </span>
                      .
                    </div>
                  </div>
                </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   REUSABLE UI
========================================================= */

const inputStyle = `
  w-full
  h-12
  rounded-xl
  bg-[#100817]
  border
  border-[#4A2864]
  px-4
  text-sm
  text-white
  outline-none
  focus:border-[#A855F7]
`;

const DetailCard:
React.FC<{
  icon: React.ReactNode;
  label: string;
  value: any;
}> = ({
  icon,
  label,
  value
}) => (
  <div
    className="
      bg-[#160C20]
      border
      border-[#3C2451]
      rounded-2xl
      p-4
    "
  >
    <div
      className="
        flex
        gap-2
        items-center
        text-[#CC8AF5]
        text-[11px]
        font-bold
        uppercase
        tracking-wide
      "
    >
      {icon}

      {label}
    </div>

    <div
      className="
        mt-2
        text-sm
        font-bold
        text-white
      "
    >
      {value || '—'}
    </div>
  </div>
);

const SectionHeader:
React.FC<{
  icon: React.ReactNode;
  title: string;
}> = ({
  icon,
  title
}) => (
  <div
    className="
      flex
      items-center
      gap-3
      mb-2
    "
  >
    <div
      className="
        text-[#B760F2]
      "
    >
      {icon}
    </div>

    <h3
      className="
        text-xl
        font-black
        text-white
      "
    >
      {title}
    </h3>

    <div
      className="
        h-px
        flex-1
        bg-gradient-to-r
        from-[#8E45C7]/50
        to-transparent
      "
    />
  </div>
);

const ControlCard:
React.FC<{
  title: string;
  current: any;
  children:
    React.ReactNode;
}> = ({
  title,
  current,
  children
}) => (
  <div
    className="
      rounded-2xl
      border
      border-[#45275B]
      bg-[#180C21]
      p-4
    "
  >
    <div
      className="
        flex
        justify-between
        gap-3
        mb-3
      "
    >
      <div
        className="
          text-sm
          font-black
          text-white
        "
      >
        {title}
      </div>

      <div
        className="
          text-[11px]
          font-bold
          text-[#C985F3]
          text-right
        "
      >
        Current:{' '}
        {current ||
          '—'}
      </div>
    </div>

    {children}
  </div>
);

const ResultCard:
React.FC<{
  title: string;
  probability: number;
  risk: string;
  colors: any;
}> = ({
  title,
  probability,
  risk,
  colors
}) => (
  <div
    className="
      rounded-2xl
      border
      border-[#402650]
      bg-[#140B1B]
      p-5
    "
  >
    <div
      className="
        text-sm
        font-black
        text-white
        mb-5
      "
    >
      {title}
    </div>

    <div
      className="
        grid
        grid-cols-2
        gap-3
      "
    >

      {/* LEAVE = RED */}

      <div
        className="
          rounded-xl
          bg-[#210C10]
          border
          border-[#FF4D4F]/25
          p-4
        "
      >
        <div
          className="
            text-[11px]
            uppercase
            font-bold
            text-[#FF8585]
          "
        >
          Leave Probability
        </div>

        <div
          className="
            text-3xl
            font-black
            text-[#FF4747]
            mt-2
          "
        >
          {pct(
            probability
          )}
        </div>
      </div>

      {/* STAY = GREEN */}

      <div
        className="
          rounded-xl
          bg-[#0B2115]
          border
          border-[#22C55E]/25
          p-4
        "
      >
        <div
          className="
            text-[11px]
            uppercase
            font-bold
            text-[#72E8A3]
          "
        >
          Stay Probability
        </div>

        <div
          className="
            text-3xl
            font-black
            text-[#2ADB79]
            mt-2
          "
        >
          {pct(
            1 -
            probability
          )}
        </div>
      </div>
    </div>

    <div
      className={`
        inline-flex
        mt-4
        px-4
        py-2
        rounded-xl
        border
        text-xs
        font-black
        ${colors.text}
        ${colors.border}
        ${colors.bg}
      `}
    >
      {risk} RISK
    </div>
  </div>
);