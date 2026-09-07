import React, { useEffect, useState } from 'react';

import {
  Building2,
  Cpu,
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { companyApi, authApi } from '../services/api';

export const CompanySettings: React.FC = () => {
  // ============================================================
  // COMPANY DATA
  // ============================================================

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // AUTHORIZED HR EMAIL
  // ============================================================

  const [newHREmail, setNewHREmail] = useState('');
  const [addHRCode, setAddHRCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [hrVerificationStep, setHRVerificationStep] =
    useState(false);

  const [hrLoading, setHRLoading] = useState(false);
  const [hrError, setHRError] = useState('');
  const [hrSuccess, setHRSuccess] = useState('');

  // ============================================================
  // LOAD COMPANY
  // ============================================================

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companyApi.getCurrent();

        setCompany(data);
      } catch (error) {
        console.error('Failed to load company information:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  // ============================================================
  // ADD NEW HR EMAIL
  // ============================================================

  const handleAddHREmail = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setHRError('');
    setHRSuccess('');

    if (!newHREmail.trim()) {
      setHRError('Please enter the new HR email.');
      return;
    }

    if (!addHRCode.trim()) {
      setHRError('Please enter the Add HR authorization code.');
      return;
    }

    try {
      setHRLoading(true);

      const result = await authApi.addHREmail(
        newHREmail.trim().toLowerCase(),
        addHRCode.trim()
      );

      setHRSuccess(
        result?.message ||
          'Verification code sent to the new HR email.'
      );

      setHRVerificationStep(true);
      setAddHRCode('');
    } catch (error: any) {
      setHRError(
        error?.response?.data?.detail ||
          'Unable to add HR email.'
      );
    } finally {
      setHRLoading(false);
    }
  };


  // ============================================================
  // VERIFY NEW HR EMAIL
  // ============================================================

  const handleVerifyHREmail = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setHRError('');
    setHRSuccess('');

    if (!verificationCode.trim()) {
      setHRError('Please enter the verification code.');
      return;
    }

    try {
      setHRLoading(true);

      const result = await authApi.verifyHREmail(
        newHREmail.trim().toLowerCase(),
        verificationCode.trim()
      );

      setHRSuccess(
        result?.message ||
          'New HR email verified and added successfully.'
      );

      setVerificationCode('');
      setAddHRCode('');
      setHRVerificationStep(false);
    } catch (error: any) {
      setHRError(
        error?.response?.data?.detail ||
          'Unable to verify HR email.'
      );
    } finally {
      setHRLoading(false);
    }
  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-purple-200 border-t-purple-700 animate-spin" />
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      className="
        min-h-[calc(100vh-118px)]
        w-full
        max-w-[1320px]
        mx-auto
        px-5
        xl:px-7
        pt-4
        pb-8
        flex
        flex-col
        gap-4
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="shrink-0">
        <h1
          className="
            text-[1.75rem]
            leading-none
            font-extrabold
            text-[#241445]
          "
        >
          Company Settings & Data Tenant Profile
        </h1>

        <p
          className="
            text-[13px]
            text-[#7E69A8]
            mt-2
            font-semibold
          "
        >
          View organization information, active ML resources
          and manage secure company access.
        </p>
      </div>

      {/* ======================================================
          TOP ROW
      ====================================================== */}

      {company && (
        <div
          className="
            grid
            grid-cols-2
            gap-4
          "
        >
          {/* ==================================================
              ORGANIZATION METADATA
          ================================================== */}

          <div
            className="
              h-full
              rounded-2xl
              p-5
              bg-[#3A245F]
              border
              border-[#7655A8]
              shadow-lg
              flex
              flex-col
            "
          >
            <h3
              className="
                text-[17px]
                font-extrabold
                text-white
                flex
                items-center
                gap-2
                mb-5
              "
            >
              <Building2
                className="
                  w-5
                  h-5
                  text-[#CBA6FF]
                "
              />

              Enterprise Organization Metadata
            </h3>

            <div
              className="
                flex-1
                flex
                flex-col
                justify-evenly
                text-[13px]
              "
            >
              {/* COMPANY NAME */}

              <div
                className="
                  flex
                  justify-between
                  gap-3
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Company Name
                </span>

                <span
                  className="
                    text-white
                    font-extrabold
                    text-right
                  "
                >
                  {company.company_name}
                </span>
              </div>

              {/* INDUSTRY */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Industry Vertical
                </span>

                <span
                  className="
                    text-[#E4CBFF]
                    font-extrabold
                    text-right
                  "
                >
                  {company.industry}
                </span>
              </div>

              {/* TENANT ID */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Data Tenant ID
                </span>

                <span
                  className="
                    text-white
                    font-extrabold
                    font-mono
                  "
                >
                  TENANT-
                  {String(company.id).padStart(4, '0')}
                </span>
              </div>

              {/* ISOLATION */}

              <div
                className="
                  flex
                  justify-between
                  items-center
                  gap-5
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Data Isolation
                </span>

                <span
                  className="
                    text-[#4FF0B2]
                    font-extrabold
                    flex
                    items-center
                    gap-1.5
                  "
                >
                  <ShieldCheck className="w-4 h-4" />

                  Company Scoped
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================
              DATASET / MODEL
          ================================================== */}

          <div
            className="
              h-full
              rounded-2xl
              p-5
              bg-[#3A245F]
              border
              border-[#7655A8]
              shadow-lg
              flex
              flex-col
            "
          >
            <h3
              className="
                text-[17px]
                font-extrabold
                text-white
                flex
                items-center
                gap-2
                mb-5
              "
            >
              <Cpu
                className="
                  w-5
                  h-5
                  text-[#CBA6FF]
                "
              />

              Active Dataset & Model Specifications
            </h3>

            <div
              className="
                flex-1
                flex
                flex-col
                justify-evenly
                text-[13px]
              "
            >
              {/* DATASET */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Active Dataset CSV
                </span>

                <span
                  className="
                    text-[#E4CBFF]
                    font-bold
                    font-mono
                    text-right
                  "
                >
                  {company.active_dataset}
                </span>
              </div>

              {/* RECORDS */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Total Employee Records
                </span>

                <span
                  className="
                    text-white
                    font-extrabold
                  "
                >
                  {company.total_employees} Employees
                </span>
              </div>

              {/* MODEL */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                  border-b
                  border-white/10
                  pb-3
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Active ML Predictor Model
                </span>

                <span
                  className="
                    text-[#4FF0B2]
                    font-extrabold
                    font-mono
                  "
                >
                  {company.active_model}
                </span>
              </div>

              {/* ACCURACY */}

              <div
                className="
                  flex
                  justify-between
                  gap-5
                "
              >
                <span
                  className="
                    text-white/75
                    font-bold
                  "
                >
                  Validation Model Accuracy
                </span>

                <span
                  className="
                    text-white
                    font-extrabold
                    font-mono
                  "
                >
                  {company.model_accuracy
                    ? `${company.model_accuracy}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BOTTOM ROW
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-[0.82fr_1.18fr]
          gap-4
          items-stretch
        "
      >
        {/* ====================================================
            SECURITY
        ==================================================== */}

        <div
          className="
            min-h-[270px]
            rounded-2xl
            p-5
            bg-[#3A245F]
            border
            border-[#7655A8]
            shadow-lg
            flex
            flex-col
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                w-11
                h-11
                shrink-0
                rounded-xl
                bg-[#42246F]
                border
                border-[#7352B6]
                flex
                items-center
                justify-center
              "
            >
              <Lock
                className="
                  w-5
                  h-5
                  text-[#E4CBFF]
                "
              />
            </div>

            <div>
              <h3
                className="
                  text-[19px]
                  font-extrabold
                  text-white
                  leading-tight
                "
              >
                Company Access Security
              </h3>

              <p
                className="
                  text-[11px]
                  text-white/60
                  font-bold
                  mt-0.5
                "
              >
                Secure company workspace access
              </p>
            </div>
          </div>

          <p
            className="
              text-[13px]
              text-white/80
              font-semibold
              leading-5
              mt-4
            "
          >
            Manage verified HR email access for
            this company workspace.
          </p>

          <div
            className="
              flex-1
              flex
              flex-col
              justify-center
              gap-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                text-[13px]
                text-white
                font-extrabold
              "
            >
              <ShieldCheck
                className="
                  w-4
                  h-4
                  text-[#4FF0B2]
                "
              />

              Company-scoped HR authorization
            </div>

            <div
              className="
                flex
                items-center
                gap-3
                text-[13px]
                text-white
                font-extrabold
              "
            >
              <KeyRound
                className="
                  w-4
                  h-4
                  text-[#CBA6FF]
                "
              />

              New HR email requires verification
            </div>

            <div
              className="
                flex
                items-center
                gap-3
                text-[13px]
                text-white
                font-extrabold
              "
            >
              <CheckCircle2
                className="
                  w-4
                  h-4
                  text-[#CBA6FF]
                "
              />

              Main HR receives security alerts
            </div>
          </div>
        </div>

        {/* ====================================================
            AUTHORIZED HR EMAIL
        ==================================================== */}

        <div
          className="
            min-h-[270px]
            rounded-2xl
            p-5
            bg-[#3A245F]
            border
            border-[#7655A8]
            shadow-lg
            flex
            flex-col
          "
        >
          {/* TITLE */}

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
              shrink-0
            "
          >
            <div>
              <h3
                className="
                  text-[19px]
                  font-extrabold
                  text-white
                  flex
                  items-center
                  gap-2
                "
              >
                <KeyRound
                  className="
                    w-5
                    h-5
                    text-[#CBA6FF]
                  "
                />

                Authorized HR Email
              </h3>

              <p
                className="
                  text-[11px]
                  text-white/60
                  mt-1
                  font-bold
                "
              >
                Company: {company?.company_name}
              </p>
            </div>

            <span
              className="
                text-[9px]
                font-extrabold
                px-3
                py-1.5
                rounded-lg
                bg-[#164C43]
                border
                border-[#2E8B78]
                text-[#75FFD8]
              "
            >
              VERIFIED ACCESS
            </span>
          </div>


          {/* DESCRIPTION */}

          <div
            className="
              mt-4
              rounded-xl
              border
              border-[#684889]
              bg-[#160924]
              px-4
              py-3
            "
          >
            <p
              className="
                text-[11px]
                leading-5
                text-white/70
                font-semibold
              "
            >
              Add another HR email to this workspace.
              The Add-HR authorization code is checked first,
              then a verification code is sent to the new email.
            </p>
          </div>


          {/* SUCCESS */}

          {hrSuccess && (
            <div
              className="
                mt-3
                p-2.5
                rounded-xl
                bg-emerald-400/10
                border
                border-emerald-400/30
                flex
                items-center
                gap-2
              "
            >
              <CheckCircle2
                className="
                  w-4
                  h-4
                  shrink-0
                  text-emerald-300
                "
              />

              <p
                className="
                  text-[11px]
                  text-emerald-200
                  font-bold
                "
              >
                {hrSuccess}
              </p>
            </div>
          )}


          {/* ERROR */}

          {hrError && (
            <div
              className="
                mt-3
                p-2.5
                rounded-xl
                bg-red-400/10
                border
                border-red-400/30
                flex
                items-center
                gap-2
              "
            >
              <AlertCircle
                className="
                  w-4
                  h-4
                  shrink-0
                  text-red-300
                "
              />

              <p
                className="
                  text-[11px]
                  text-red-200
                  font-bold
                "
              >
                {hrError}
              </p>
            </div>
          )}


          {!hrVerificationStep ? (

            /* ==================================================
               STEP 1 - ADD EMAIL
            ================================================== */

            <form
              onSubmit={handleAddHREmail}
              className="
                flex-1
                flex
                flex-col
                justify-center
              "
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-extrabold
                      text-white
                      mb-1.5
                    "
                  >
                    New HR Email
                  </label>

                  <input
                    type="email"
                    value={newHREmail}
                    onChange={(event) => {
                      setNewHREmail(
                        event.target.value
                      );

                      setHRError('');
                      setHRSuccess('');
                    }}
                    placeholder="example@gmail.com"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      px-4
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />
                </div>


                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-extrabold
                      text-white
                      mb-1.5
                    "
                  >
                    Add-HR Authorization Code
                  </label>

                  <input
                    type="password"
                    value={addHRCode}
                    onChange={(event) => {
                      setAddHRCode(
                        event.target.value
                      );

                      setHRError('');
                      setHRSuccess('');
                    }}
                    placeholder="Enter authorization code"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      px-4
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />
                </div>
              </div>


              <div
                className="
                  flex
                  justify-end
                  mt-5
                "
              >
                <button
                  type="submit"
                  disabled={
                    hrLoading ||
                    !newHREmail ||
                    !addHRCode
                  }
                  className="
                    min-w-[245px]
                    h-[45px]
                    px-6
                    rounded-xl
                    bg-gradient-to-r
                    from-[#7C4DDA]
                    to-[#9B57E7]
                    text-white
                    text-[12px]
                    font-extrabold
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-lg
                    shadow-purple-900/30
                    hover:brightness-110
                    transition
                    disabled:opacity-45
                    disabled:cursor-not-allowed
                  "
                >
                  {hrLoading ? (
                    <>
                      <div
                        className="
                          w-4
                          h-4
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                          animate-spin
                        "
                      />

                      Sending Code...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />

                      Add New HR Email
                    </>
                  )}
                </button>
              </div>
            </form>

          ) : (

            /* ==================================================
               STEP 2 - VERIFY EMAIL
            ================================================== */

            <form
              onSubmit={handleVerifyHREmail}
              className="
                flex-1
                flex
                flex-col
                justify-center
              "
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-extrabold
                      text-white
                      mb-1.5
                    "
                  >
                    New HR Email
                  </label>

                  <input
                    value={newHREmail}
                    readOnly
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      px-4
                      text-[12px]
                      text-white/70
                      font-semibold
                      outline-none
                    "
                  />
                </div>


                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-extrabold
                      text-white
                      mb-1.5
                    "
                  >
                    Email Verification Code
                  </label>

                  <input
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(
                        event.target.value
                      );

                      setHRError('');
                      setHRSuccess('');
                    }}
                    placeholder="6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      px-4
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />
                </div>
              </div>


              <div
                className="
                  flex
                  items-center
                  justify-between
                  mt-5
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setHRVerificationStep(false);
                    setVerificationCode('');
                    setHRError('');
                    setHRSuccess('');
                  }}
                  className="
                    h-[45px]
                    px-5
                    rounded-xl
                    border
                    border-[#684889]
                    text-white/75
                    text-[11px]
                    font-extrabold
                    hover:bg-white/5
                    transition
                  "
                >
                  Change Email
                </button>

                <button
                  type="submit"
                  disabled={
                    hrLoading ||
                    !verificationCode
                  }
                  className="
                    min-w-[245px]
                    h-[45px]
                    px-6
                    rounded-xl
                    bg-gradient-to-r
                    from-[#7C4DDA]
                    to-[#9B57E7]
                    text-white
                    text-[12px]
                    font-extrabold
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-lg
                    shadow-purple-900/30
                    hover:brightness-110
                    transition
                    disabled:opacity-45
                    disabled:cursor-not-allowed
                  "
                >
                  {hrLoading ? (
                    <>
                      <div
                        className="
                          w-4
                          h-4
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                          animate-spin
                        "
                      />

                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />

                      Verify & Add HR Email
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};