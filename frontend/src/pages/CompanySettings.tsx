import React, { useEffect, useState } from 'react';

import {
  Building2,
  Cpu,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
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
  // PASSWORD DATA
  // ============================================================

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must contain at least 8 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New password and confirm password do not match.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        'New password must be different from the current password.'
      );
      return;
    }

    setChangingPassword(true);

    try {
      const result = await authApi.changePassword(
        currentPassword,
        newPassword
      );

      setPasswordSuccess(
        result?.message ||
          'Company password updated successfully.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.detail ||
          'Unable to update password.'
      );
    } finally {
      setChangingPassword(false);
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
        h-[calc(100vh-118px)]
        overflow-hidden
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
            flex-1
            min-h-0
          "
        >
          {/* ==================================================
              ORGANIZATION METADATA
          ================================================== */}

          <div
            className="
              h-full
              rounded-2xl
              p-6
              bg-[#2B174D]
              border
              border-[#62439B]
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
              p-6
              bg-[#2B174D]
              border
              border-[#62439B]
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
          grid-cols-[0.78fr_1.22fr]
          gap-4
          flex-1
          min-h-0
        "
      >
        {/* ====================================================
            SECURITY
        ==================================================== */}

        <div
          className="
            h-full
            rounded-2xl
            p-6
            bg-[#2B174D]
            border
            border-[#62439B]
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
            Securely update the password used to access
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

              Current password verification
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

              Password stored as secure hash
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

              Minimum 8 characters
            </div>
          </div>
        </div>

        {/* ====================================================
            CHANGE PASSWORD
        ==================================================== */}

        <div
          className="
            h-full
            rounded-2xl
            p-6
            bg-[#2B174D]
            border
            border-[#62439B]
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

                Change Company Password
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
              SECURE UPDATE
            </span>
          </div>

          {/* SUCCESS */}

          {passwordSuccess && (
            <div
              className="
                mt-3
                p-2
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
                {passwordSuccess}
              </p>
            </div>
          )}

          {/* ERROR */}

          {passwordError && (
            <div
              className="
                mt-3
                p-2
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
                {passwordError}
              </p>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleChangePassword}
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
                grid-cols-3
                gap-3
              "
            >
              {/* CURRENT PASSWORD */}

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
                  Current Password
                </label>

                <div className="relative">
                  <Lock
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-[#C9A6ED]
                    "
                  />

                  <input
                    type={
                      showCurrentPassword
                        ? 'text'
                        : 'password'
                    }
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(
                        event.target.value
                      );

                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    placeholder="Current password"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      pl-10
                      pr-10
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-white/45
                      hover:text-white
                    "
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD */}

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
                  New Password
                </label>

                <div className="relative">
                  <KeyRound
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-[#C9A6ED]
                    "
                  />

                  <input
                    type={
                      showNewPassword
                        ? 'text'
                        : 'password'
                    }
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);

                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    placeholder="New password"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      pl-10
                      pr-10
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-white/45
                      hover:text-white
                    "
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}

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
                  Confirm Password
                </label>

                <div className="relative">
                  <ShieldCheck
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-[#C9A6ED]
                    "
                  />

                  <input
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(
                        event.target.value
                      );

                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    placeholder="Confirm password"
                    className="
                      w-full
                      h-[46px]
                      bg-[#160924]
                      border
                      border-[#684889]
                      rounded-xl
                      pl-10
                      pr-10
                      text-[12px]
                      text-white
                      font-semibold
                      placeholder-white/30
                      focus:outline-none
                      focus:border-[#AE7FE0]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-white/45
                      hover:text-white
                    "
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BUTTON */}

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
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
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
                {changingPassword ? (
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

                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />

                    Update Company Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};