import React, { useState } from 'react';

import {
  BrainCircuit,
  Building2,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Database,
  BarChart3,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/* =========================================================
   API
========================================================= */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1';

/* =========================================================
   COMPANY CONFIG
========================================================= */

type Company = {
  id: number;
  name: string;
  shortName: string;
  industry: string;
  dataset: string;
  loginId: string;
};

const COMPANIES: Company[] = [
  {
    id: 1,
    name: 'IBM HR Analytics',
    shortName: 'IBM',
    industry: 'Technology & Research',
    dataset: 'IBM HR Employee Attrition Dataset',
    loginId: 'IBM HR Analytics',
  },

  {
    id: 2,
    name: 'NovaTech Solutions',
    shortName: 'NT',
    industry: 'Enterprise Technology',
    dataset: 'Saudi Employee Attrition Dataset',
    loginId: 'NovaTech Solutions',
  },

  {
    id: 3,
    name: 'Lavender Systems',
    shortName: 'LS',
    industry: 'Business Services',
    dataset: 'Indian HR Attrition Dataset',
    loginId: 'Lavender Systems',
  },
];

/* =========================================================
   LOGIN
========================================================= */

export const Login: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<number>(1);

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState('');

  const selectedCompany =
    COMPANIES.find(
      (company) =>
        company.id === selectedCompanyId,
    ) || COMPANIES[0];

  /* =======================================================
     COMPANY SELECT
  ======================================================= */

  const selectCompany = (
    companyId: number,
  ) => {
    setSelectedCompanyId(companyId);
    setPassword('');
    setLoginError('');
    setShowPassword(false);
  };

  /* =======================================================
     LOGIN REQUEST
  ======================================================= */

  const handleLogin = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setLoginError('');

    if (!password.trim()) {
      setLoginError(
        'Please enter your password.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            company_name:
              selectedCompany.name,
            password,
          }),
        },
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /* ================================================
         LOGIN ERROR
      ================================================ */

      if (!response.ok) {
        let message =
          'Login failed. Please check your password.';

        if (
          typeof data?.detail === 'string'
        ) {
          message = data.detail;
        } else if (
          typeof data?.message === 'string'
        ) {
          message = data.message;
        } else if (
          response.status === 401
        ) {
          message =
            'Incorrect password for the selected company.';
        }

        setLoginError(message);
        return;
      }

      /* ================================================
         GET TOKEN
      ================================================ */

      const token =
        data?.access_token ||
        data?.token ||
        '';

      if (!token) {
        setLoginError(
          'Login succeeded but no authentication token was returned.',
        );
        return;
      }

      /* ================================================
         IMPORTANT AUTH TOKEN

         AuthContext + API interceptor use
         "attrition_token".
      ================================================ */

      localStorage.setItem(
        'attrition_token',
        token,
      );

      localStorage.setItem(
        'access_token',
        token,
      );

      localStorage.setItem(
        'token',
        token,
      );

      /* ================================================
         COMPANY INFORMATION
      ================================================ */

      localStorage.setItem(
        'company_name',
        selectedCompany.name,
      );

      localStorage.setItem(
        'company_id',
        String(
          data?.company_id ??
            selectedCompany.id,
        ),
      );

      if (data?.company) {
        localStorage.setItem(
          'company',
          JSON.stringify(
            data.company,
          ),
        );
      }

      if (data?.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(
            data.user,
          ),
        );
      }

      setPassword('');
      setLoginError('');

      /*
        Full reload lets AuthContext start again
        and read attrition_token correctly.
      */

      window.location.replace(
        '/dashboard',
      );
    } catch (error) {
      console.error(
        'Login error:',
        error,
      );

      setLoginError(
        'Unable to connect to the backend. Please make sure the backend is running.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div
      className="
        h-screen
        w-full
        overflow-hidden
        bg-[#06030B]
        text-white
        relative
      "
    >
      {/* =================================================
          BACKGROUND EFFECTS
      ================================================= */}

      <div
        className="
          absolute
          inset-0
          overflow-hidden
          pointer-events-none
        "
      >
        <div
          className="
            absolute
            -top-[220px]
            -left-[180px]
            w-[600px]
            h-[600px]
            rounded-full
            bg-violet-700/10
            blur-[150px]
          "
        />

        <div
          className="
            absolute
            -bottom-[260px]
            right-[2%]
            w-[650px]
            h-[650px]
            rounded-full
            bg-fuchsia-700/[0.08]
            blur-[160px]
          "
        />

        <div
          className="
            absolute
            top-[35%]
            left-[38%]
            w-[420px]
            h-[420px]
            rounded-full
            bg-indigo-600/10
            blur-[130px]
          "
        />

        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
            bg-[linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)]
            bg-[size:42px_42px]
          "
        />
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div
        className="
          relative
          z-10
          h-screen
          grid
          lg:grid-cols-[0.92fr_1.08fr]
        "
      >
        {/* =================================================
            LEFT
        ================================================= */}

        <div
          className="
            hidden
            lg:flex
            flex-col
            justify-between
            px-10
            xl:px-14
            py-7
            border-r
            border-white/[0.06]
            relative
          "
        >
          <div>
            {/* BRAND */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  border
                  border-violet-400/30
                  bg-gradient-to-br
                  from-violet-600/25
                  to-fuchsia-600/20
                  shadow-[0_0_30px_rgba(139,92,246,.16)]
                "
              >
                <BrainCircuit
                  className="
                    w-5
                    h-5
                    text-violet-300
                  "
                />
              </div>

              <div>
                <div
                  className="
                    text-lg
                    font-black
                    tracking-[0.08em]
                  "
                >
                  ATTRITION

                  <span
                    className="
                      text-violet-400
                      ml-1
                    "
                  >
                    AI
                  </span>
                </div>

                <div
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.25em]
                    text-[#7F7390]
                    mt-0.5
                  "
                >
                  Predict • Prevent • Retain
                </div>
              </div>
            </div>

            {/* HERO */}

            <div
              className="
                mt-10
                max-w-xl
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  border
                  border-violet-500/20
                  bg-violet-500/[0.07]
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-violet-300
                "
              >
                <BrainCircuit
                  className="
                    w-3.5
                    h-3.5
                  "
                />

                Multi-Company Attrition
                Intelligence
              </div>

              <h1
                className="
                  mt-5
                  text-[44px]
                  xl:text-[54px]
                  leading-[1.02]
                  font-black
                  tracking-[-0.04em]
                "
              >
                One intelligence
                <br />

                experience.
                <br />

                <span
                  className="
                    text-transparent
                    bg-clip-text
                    bg-gradient-to-r
                    from-violet-400
                    via-purple-400
                    to-fuchsia-400
                  "
                >
                  Three company
                  <br />
                  datasets.
                </span>
              </h1>

              <p
                className="
                  mt-4
                  text-[13px]
                  leading-6
                  text-[#9589A2]
                  max-w-lg
                "
              >
                Explore isolated workforce
                datasets, trained
                machine-learning models,
                employee risk predictions
                and company-specific
                analytics through one secure
                interface.
              </p>
            </div>
          </div>

          {/* FEATURES */}

          <div
            className="
              grid
              grid-cols-3
              gap-3
            "
          >
            <FeatureBox
              icon={
                <Database
                  className="
                    w-4
                    h-4
                  "
                />
              }
              top="3 isolated"
              bottom="Datasets"
            />

            <FeatureBox
              icon={
                <BarChart3
                  className="
                    w-4
                    h-4
                  "
                />
              }
              top="Per company"
              bottom="ML Insights"
            />

            <FeatureBox
              icon={
                <ShieldCheck
                  className="
                    w-4
                    h-4
                  "
                />
              }
              top="Secure"
              bottom="Login Flow"
            />
          </div>
        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-center
            px-5
            sm:px-7
            py-5
            h-screen
            overflow-y-auto
          "
        >
          <div
            className="
              w-full
              max-w-[780px]
            "
          >
            {/* HEADER */}

            <div
              className="
                mb-3
              "
            >
              <div
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.2em]
                  font-black
                  text-violet-400
                "
              >
                Workspace Access
              </div>

              <h2
                className="
                  mt-1.5
                  text-2xl
                  font-black
                  tracking-tight
                "
              >
                Choose a company
              </h2>

              <p
                className="
                  mt-1
                  text-[12px]
                  text-[#8E8199]
                "
              >
                Each company opens its own
                workforce data and trained
                model.
              </p>
            </div>

            {/* =================================================
                COMPANY CARDS
            ================================================= */}

            <div
              className="
                grid
                md:grid-cols-3
                gap-3
              "
            >
              {COMPANIES.map(
                (company, index) => {
                  const selected =
                    company.id ===
                    selectedCompanyId;

                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() =>
                        selectCompany(
                          company.id,
                        )
                      }
                      className={`
                        relative
                        text-left
                        rounded-2xl
                        border
                        p-3
                        transition-all
                        duration-200

                        ${
                          selected
                            ? `
                              border-violet-400/60
                              bg-gradient-to-br
                              from-violet-700/20
                              to-fuchsia-700/10
                              shadow-[0_0_28px_rgba(139,92,246,.13)]
                            `
                            : `
                              border-[#302039]
                              bg-[#100815]
                              hover:border-violet-500/35
                              hover:bg-[#150B1C]
                            `
                        }
                      `}
                    >
                      <div
                        className="
                          flex
                          justify-between
                          items-start
                        "
                      >
                        <div
                          className={`
                            w-8
                            h-8
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            border

                            ${
                              selected
                                ? `
                                  border-violet-400/35
                                  bg-violet-500/15
                                  text-violet-300
                                `
                                : `
                                  border-[#3C2748]
                                  bg-[#190E20]
                                  text-[#A483B5]
                                `
                            }
                          `}
                        >
                          <Building2
                            className="
                              w-4
                              h-4
                            "
                          />
                        </div>

                        <span
                          className="
                            text-[9px]
                            font-black
                            tracking-[0.12em]
                            text-[#6F5F7A]
                          "
                        >
                          0{index + 1}
                        </span>
                      </div>

                      <div
                        className="
                          mt-2.5
                          text-[13px]
                          font-black
                          text-white
                        "
                      >
                        {company.name}
                      </div>

                      <div
                        className="
                          mt-1.5
                          text-[9px]
                          leading-4
                          text-[#807187]
                          min-h-[32px]
                        "
                      >
                        {company.dataset}
                      </div>

                      <div
                        className="
                          mt-2.5
                          text-[9px]
                          font-bold
                          text-violet-300
                        "
                      >
                        Company password
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {/* =================================================
                LOGIN PANEL
            ================================================= */}

            <form
              onSubmit={handleLogin}
              className="
                mt-3
                rounded-[22px]
                border
                border-[#352141]
                bg-[#0E0713]/95
                p-4
                sm:p-5
                shadow-[0_25px_70px_rgba(0,0,0,.30)]
              "
            >
              {/* SELECTED WORKSPACE */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  pb-3
                  border-b
                  border-white/[0.06]
                "
              >
                <div>
                  <div
                    className="
                      text-[9px]
                      uppercase
                      tracking-[0.16em]
                      font-black
                      text-violet-400
                    "
                  >
                    Selected Workspace
                  </div>

                  <div
                    className="
                      mt-1
                      text-[16px]
                      font-black
                      text-white
                    "
                  >
                    {selectedCompany.name}
                  </div>

                  <div
                    className="
                      mt-0.5
                      text-[10px]
                      text-[#887890]
                    "
                  >
                    {
                      selectedCompany.industry
                    }
                  </div>
                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    px-2.5
                    py-1.5
                    border
                    border-violet-500/25
                    bg-violet-500/[0.08]
                    text-[9px]
                    font-black
                    text-violet-300
                    uppercase
                    tracking-wider
                    shrink-0
                  "
                >
                  <ShieldCheck
                    className="
                      w-3
                      h-3
                    "
                  />

                  Secure Access
                </div>
              </div>

              {/* INFO */}

              <div
                className="
                  mt-3
                  rounded-xl
                  border
                  border-violet-500/15
                  bg-violet-500/[0.05]
                  px-3
                  py-2.5
                  flex
                  gap-2.5
                  items-start
                "
              >
                <ShieldCheck
                  className="
                    w-4
                    h-4
                    mt-0.5
                    shrink-0
                    text-violet-400
                  "
                />

                <div>
                  <div
                    className="
                      text-[11px]
                      font-bold
                      text-[#D7C9DE]
                    "
                  >
                    Secure company access
                  </div>

                  <div
                    className="
                      mt-0.5
                      text-[10px]
                      leading-4
                      text-[#817386]
                    "
                  >
                    Enter the password
                    assigned to this company
                    workspace.
                  </div>
                </div>
              </div>

              {/* =================================================
                  INPUTS
              ================================================= */}

              <div
                className="
                  grid
                  md:grid-cols-2
                  gap-3
                  mt-3
                "
              >
                {/* COMPANY */}

                <div>
                  <label
                    className="
                      block
                      mb-1.5
                      text-[10px]
                      font-bold
                      text-[#B7A8BE]
                    "
                  >
                    Company
                  </label>

                  <div className="relative">
                    <Building2
                      className="
                        absolute
                        left-3.5
                        top-3.5
                        w-4
                        h-4
                        text-violet-400
                      "
                    />

                    <input
                      value={
                        selectedCompany.loginId
                      }
                      readOnly
                      className="
                        w-full
                        h-11
                        rounded-xl
                        border
                        border-[#33213E]
                        bg-[#09050D]
                        pl-10
                        pr-4
                        text-[12px]
                        font-semibold
                        text-[#BCAFC3]
                        outline-none
                        cursor-default
                      "
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    className="
                      block
                      mb-1.5
                      text-[10px]
                      font-bold
                      text-[#B7A8BE]
                    "
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className={`
                        absolute
                        left-3.5
                        top-3.5
                        w-4
                        h-4

                        ${
                          loginError
                            ? 'text-red-400'
                            : 'text-violet-400'
                        }
                      `}
                    />

                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      autoComplete="current-password"
                      onChange={(event) => {
                        setPassword(
                          event.target.value,
                        );

                        if (loginError) {
                          setLoginError('');
                        }
                      }}
                      placeholder="Enter password"
                      className={`
                        w-full
                        h-11
                        rounded-xl
                        bg-[#09050D]
                        pl-10
                        pr-11
                        text-[12px]
                        text-white
                        outline-none
                        border
                        transition-all

                        ${
                          loginError
                            ? `
                              border-red-500/70
                              focus:border-red-400
                              shadow-[0_0_0_3px_rgba(239,68,68,.06)]
                            `
                            : `
                              border-[#33213E]
                              focus:border-violet-500/70
                              focus:shadow-[0_0_0_3px_rgba(139,92,246,.06)]
                            `
                        }
                      `}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous,
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="
                        absolute
                        right-3.5
                        top-3.5
                        text-[#75667D]
                        hover:text-violet-300
                        transition
                      "
                    >
                      {showPassword ? (
                        <EyeOff
                          className="
                            w-4
                            h-4
                          "
                        />
                      ) : (
                        <Eye
                          className="
                            w-4
                            h-4
                          "
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {loginError && (
                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2.5
                    rounded-xl
                    border
                    border-red-500/35
                    bg-red-500/[0.08]
                    px-3
                    py-2.5
                    text-[11px]
                    text-red-300
                  "
                >
                  <AlertCircle
                    className="
                      w-4
                      h-4
                      shrink-0
                      text-red-400
                    "
                  />

                  <span className="font-semibold">
                    {loginError}
                  </span>
                </div>
              )}

              {/* =================================================
                  CONTINUE
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-3
                  w-full
                  min-h-[52px]
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  gap-3
                  bg-gradient-to-r
                  from-violet-600
                  via-purple-600
                  to-fuchsia-600
                  text-white
                  text-sm
                  font-black
                  hover:brightness-110
                  active:scale-[0.995]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  transition-all
                  shadow-[0_12px_35px_rgba(139,92,246,.18)]
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
                    />

                    Verifying Access...
                  </>
                ) : (
                  <>
                    Continue

                    <ArrowRight
                      className="
                        w-4
                        h-4
                      "
                    />
                  </>
                )}
              </button>

              {/* FOOTER */}

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-[9px]
                  text-[#6F6175]
                "
              >
                <LockKeyhole
                  className="
                    w-3
                    h-3
                  "
                />

                Company data is isolated and
                protected by authenticated
                access.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   FEATURE BOX
========================================================= */

const FeatureBox: React.FC<{
  icon: React.ReactNode;
  top: string;
  bottom: string;
}> = ({
  icon,
  top,
  bottom,
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#2E1E38]
        bg-[#0E0713]/80
        p-3
      "
    >
      <div className="text-violet-400">
        {icon}
      </div>

      <div
        className="
          mt-2
          text-[9px]
          text-[#77687E]
        "
      >
        {top}
      </div>

      <div
        className="
          mt-0.5
          text-[11px]
          font-black
          text-[#D8CFDD]
        "
      >
        {bottom}
      </div>
    </div>
  );
};

export default Login;