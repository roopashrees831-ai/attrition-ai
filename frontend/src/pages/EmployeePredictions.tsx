import React, { useEffect, useMemo, useState } from 'react';
import { predictionsApi } from '../services/api';
import { EmployeeDetailModal } from './EmployeeDetailModal';

import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';

export const EmployeePredictions: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // HIGH / MEDIUM / LOW / ALL
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedEmployee, setSelectedEmployee] =
    useState<any>(null);

  const [predictedEmployees, setPredictedEmployees] =
    useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const fetchEmployees = async () => {
    setLoading(true);

    try {
      const data =
        await predictionsApi.getEmployees({});

      setEmployees(data);
    } catch (error) {
      console.error(
        'Failed to load employees:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================================================
  // DEPARTMENTS
  // =========================================================

  const departments = useMemo(() => {
    const values = employees
      .map((employee) => employee.department)
      .filter(Boolean);

    return [
      'All',
      ...Array.from(new Set(values)).sort()
    ];
  }, [employees]);

  // =========================================================
  // PREDICT ALL CATEGORY
  // =========================================================

  const handlePredictAllRisk = (
    riskLevel: string
  ) => {
    const matchingEmployees =
      employees.filter(
        (employee) =>
          String(
            employee.risk_level || ''
          ).toUpperCase() === riskLevel
      );

    // Reveal predictions for every employee
    // inside this category
    setPredictedEmployees(() => {
      const updated = new Set<string>();

      matchingEmployees.forEach(
        (employee) => {
          const key = String(
            employee.id ??
            employee.employee_id
          );

          updated.add(key);
        }
      );

      return updated;
    });

    // Show ONLY selected risk
    setCategoryFilter(riskLevel);

    // Go back to first page
    setCurrentPage(1);
  };

  // =========================================================
  // SHOW ALL
  // =========================================================

  const handleShowAll = () => {
    setCategoryFilter('ALL');

    // Return all rows to not-predicted state
    setPredictedEmployees(
      new Set()
    );

    setCurrentPage(1);
  };

  // =========================================================
  // PREDICT ONE EMPLOYEE
  // =========================================================

  const handlePredictRisk = (
    employee: any
  ) => {
    const key = String(
      employee.id ??
      employee.employee_id
    );

    setPredictedEmployees(
      (previous) => {
        const updated =
          new Set(previous);

        updated.add(key);

        return updated;
      }
    );
  };

  // =========================================================
  // FILTER EMPLOYEES
  // =========================================================

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (employee) => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        const employeeId =
          String(
            employee.employee_id || ''
          ).toLowerCase();

        const role =
          String(
            employee.job_role || ''
          ).toLowerCase();

        const department =
          String(
            employee.department || ''
          ).toLowerCase();

        const risk =
          String(
            employee.risk_level || ''
          ).toUpperCase();

        // SEARCH
        const matchesSearch =
          !searchValue ||
          employeeId.includes(
            searchValue
          ) ||
          role.includes(
            searchValue
          ) ||
          department.includes(
            searchValue
          );

        // DEPARTMENT
        const matchesDepartment =
          deptFilter === 'All' ||
          employee.department ===
            deptFilter;

        // CATEGORY BUTTON FILTER
        const matchesCategory =
          categoryFilter === 'ALL' ||
          risk === categoryFilter;

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesCategory
        );
      }
    );
  }, [
    employees,
    search,
    deptFilter,
    categoryFilter
  ]);

  // =========================================================
  // EMPLOYEE ID ASCENDING
  // =========================================================

  const sortedEmployees =
    useMemo(() => {
      return [...filteredEmployees].sort(
        (a, b) => {
          const aId =
            String(
              a.employee_id || ''
            );

          const bId =
            String(
              b.employee_id || ''
            );

          return aId.localeCompare(
            bId,
            undefined,
            {
              numeric: true,
              sensitivity: 'base'
            }
          );
        }
      );
    }, [filteredEmployees]);

  // =========================================================
  // RESET PAGE
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    deptFilter
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      sortedEmployees.length /
      itemsPerPage
    );

  const paginatedEmployees =
    sortedEmployees.slice(
      (currentPage - 1) *
        itemsPerPage,

      currentPage *
        itemsPerPage
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-[#2D1B4E]">
          Employee Risk Prediction
        </h1>

        <p className="text-sm text-[#8A73B5] mt-1">
          Select a category to predict and view employees by risk level.
        </p>
      </div>

      {/* =====================================================
          CATEGORY BUTTONS
      ===================================================== */}

      <div className="
        bg-white
        border
        border-[#E8DFFF]
        rounded-2xl
        p-4
      ">

        <p className="
          text-sm
          font-semibold
          text-[#2D1B4E]
          mb-3
        ">
          Predict Risk by Category
        </p>

        <div className="flex flex-wrap gap-3">

          {/* HIGH */}

          <button
            onClick={() =>
              handlePredictAllRisk(
                'HIGH'
              )
            }
            className={`
              px-4
              py-2.5
              rounded-xl
              border
              text-sm
              font-semibold
              flex
              items-center
              gap-2
              transition

              ${
                categoryFilter === 'HIGH'
                  ? `
                    bg-red-500
                    text-white
                    border-red-500
                  `
                  : `
                    bg-red-50
                    text-red-600
                    border-red-200
                    hover:bg-red-100
                  `
              }
            `}
          >
            <AlertTriangle className="w-4 h-4" />

            Predict All High
          </button>

          {/* MEDIUM */}

          <button
            onClick={() =>
              handlePredictAllRisk(
                'MEDIUM'
              )
            }
            className={`
              px-4
              py-2.5
              rounded-xl
              border
              text-sm
              font-semibold
              flex
              items-center
              gap-2
              transition

              ${
                categoryFilter === 'MEDIUM'
                  ? `
                    bg-yellow-400
                    text-yellow-950
                    border-yellow-400
                  `
                  : `
                    bg-yellow-50
                    text-yellow-700
                    border-yellow-200
                    hover:bg-yellow-100
                  `
              }
            `}
          >
            <Clock className="w-4 h-4" />

            Predict All Medium
          </button>

          {/* LOW */}

          <button
            onClick={() =>
              handlePredictAllRisk(
                'LOW'
              )
            }
            className={`
              px-4
              py-2.5
              rounded-xl
              border
              text-sm
              font-semibold
              flex
              items-center
              gap-2
              transition

              ${
                categoryFilter === 'LOW'
                  ? `
                    bg-green-500
                    text-white
                    border-green-500
                  `
                  : `
                    bg-green-50
                    text-green-600
                    border-green-200
                    hover:bg-green-100
                  `
              }
            `}
          >
            <ShieldCheck className="w-4 h-4" />

            Predict All Low
          </button>

          {/* SHOW ALL */}

          <button
            onClick={handleShowAll}
            className={`
              px-4
              py-2.5
              rounded-xl
              border
              text-sm
              font-semibold
              flex
              items-center
              gap-2
              transition

              ${
                categoryFilter === 'ALL'
                  ? `
                    bg-purple-600
                    text-white
                    border-purple-600
                  `
                  : `
                    bg-purple-50
                    text-purple-600
                    border-purple-200
                    hover:bg-purple-100
                  `
              }
            `}
          >
            <Users className="w-4 h-4" />

            Show All
          </button>

        </div>

      </div>

      {/* =====================================================
          SEARCH + DEPARTMENT
      ===================================================== */}

      <div className="
        bg-white
        border
        border-[#E8DFFF]
        rounded-2xl
        p-4
        flex
        flex-col
        md:flex-row
        gap-4
        justify-between
      ">

        {/* SEARCH */}

        <div className="relative w-full md:w-96">

          <Search className="
            w-4
            h-4
            text-[#8A73B5]
            absolute
            left-3.5
            top-3
          " />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search employee ID, role or department..."
            className="
              w-full
              bg-[#FBF9FF]
              border
              border-[#E4D8FA]
              rounded-xl
              pl-10
              pr-4
              py-2.5
              text-sm
              text-[#2D1B4E]
              focus:outline-none
              focus:border-purple-400
            "
          />

        </div>

        {/* DEPARTMENT */}

        <select
          value={deptFilter}
          onChange={(event) =>
            setDeptFilter(
              event.target.value
            )
          }
          className="
            bg-[#FBF9FF]
            border
            border-[#E4D8FA]
            rounded-xl
            px-4
            py-2.5
            text-sm
            text-[#5E4B84]
            focus:outline-none
            focus:border-purple-400
          "
        >

          {departments.map(
            (department) => (
              <option
                key={department}
                value={department}
              >
                {department === 'All'
                  ? 'All Departments'
                  : department}
              </option>
            )
          )}

        </select>

      </div>

      {/* =====================================================
          ACTIVE CATEGORY TITLE
      ===================================================== */}

      {categoryFilter !== 'ALL' && (
        <div
          className={`
            px-4
            py-3
            rounded-xl
            text-sm
            font-semibold

            ${
              categoryFilter === 'HIGH'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : categoryFilter === 'MEDIUM'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-green-50 text-green-600 border border-green-200'
            }
          `}
        >
          Showing only {categoryFilter} risk employees
          {' '}({sortedEmployees.length})
        </div>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="
        bg-white
        border
        border-[#E8DFFF]
        rounded-2xl
        overflow-hidden
        shadow-sm
      ">

        <div className="overflow-x-auto">

          <table className="
            w-full
            text-left
            text-sm
          ">

            <thead>

              <tr className="
                bg-[#F7F3FF]
                border-b
                border-[#E8DFFF]
                text-[#725E96]
                text-xs
              ">

                <th className="py-4 px-4">
                  Employee
                </th>

                <th className="py-4 px-4">
                  Department & Role
                </th>

                <th className="py-4 px-4">
                  Satisfaction
                </th>

                <th className="py-4 px-4">
                  Overtime
                </th>

                <th className="py-4 px-4">
                  Risk Level
                </th>

                <th className="py-4 px-4">
                  Probability
                </th>

                <th className="py-4 px-4">
                  Risk Factor
                </th>

                <th className="py-4 px-4 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="
                      py-14
                      text-center
                      text-[#8A73B5]
                    "
                  >
                    Loading employees...
                  </td>

                </tr>

              ) : paginatedEmployees.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="
                      py-12
                      text-center
                      text-gray-400
                    "
                  >
                    No employees found.
                  </td>

                </tr>

              ) : (

                paginatedEmployees.map(
                  (employee) => {

                    const employeeKey =
                      String(
                        employee.id ??
                        employee.employee_id
                      );

                    const isPredicted =
                      predictedEmployees.has(
                        employeeKey
                      );

                    const probability =
                      Math.round(
                        (
                          employee.probability ||
                          0
                        ) * 100
                      );

                    const primaryFactor =
                      employee
                        .top_risk_factors?.[0]
                        ?.factor ||
                      'Standard Indicators';

                    return (

                      <tr
                        key={employeeKey}
                        className="
                          border-b
                          border-[#F0EAFA]
                          hover:bg-[#FCFAFF]
                        "
                      >

                        <td className="
                          py-4
                          px-4
                          font-semibold
                          text-purple-600
                        ">
                          {employee.employee_id}
                        </td>

                        <td className="py-4 px-4">

                          <div className="
                            font-semibold
                            text-[#2D1B4E]
                          ">
                            {employee.job_role}
                          </div>

                          <div className="
                            text-xs
                            text-[#9786B5]
                            mt-1
                          ">
                            {employee.department}
                          </div>

                        </td>

                        <td className="py-4 px-4">

                          {employee.job_satisfaction
                            ? `${employee.job_satisfaction}/4`
                            : '-'}

                        </td>

                        <td className="py-4 px-4">

                          <span className={`
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs

                            ${
                              String(
                                employee.overtime
                              ).toLowerCase()
                              === 'yes'

                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'

                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }
                          `}>
                            {employee.overtime}
                          </span>

                        </td>

                        {/* RISK */}

                        <td className="py-4 px-4">

                          {!isPredicted ? (

                            <span className="text-xs text-gray-400">
                              Not predicted
                            </span>

                          ) : (

                            <span className={`
                              inline-flex
                              px-2.5
                              py-1
                              rounded-full
                              text-xs
                              font-semibold

                              ${
                                employee.risk_level === 'HIGH'

                                  ? 'bg-red-50 text-red-600 border border-red-200'

                                  : employee.risk_level === 'MEDIUM'

                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'

                                    : 'bg-green-50 text-green-600 border border-green-200'
                              }
                            `}>

                              {employee.risk_level}

                            </span>

                          )}

                        </td>

                        {/* PROBABILITY */}

                        <td className="
                          py-4
                          px-4
                          font-semibold
                        ">
                          {isPredicted
                            ? `${probability}%`
                            : '--'}
                        </td>

                        {/* FACTOR */}

                        <td className="py-4 px-4">

                          {isPredicted
                            ? primaryFactor
                            : (
                              <span className="text-gray-400 text-xs">
                                Click Predict Risk
                              </span>
                            )}

                        </td>

                        {/* ACTION */}

                        <td className="py-4 px-4 text-right">

                          {!isPredicted ? (

                            <button
                              onClick={() =>
                                handlePredictRisk(
                                  employee
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2
                                rounded-xl
                                bg-purple-600
                                text-white
                                text-xs
                                font-semibold
                              "
                            >
                              <Sparkles className="w-3.5 h-3.5" />

                              Predict Risk
                            </button>

                          ) : (

                            <button
                              onClick={() =>
                                setSelectedEmployee(
                                  employee
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2
                                rounded-xl
                                bg-[#F2EBFF]
                                text-purple-700
                                text-xs
                                font-semibold
                              "
                            >
                              <Eye className="w-3.5 h-3.5" />

                              View Result
                            </button>

                          )}

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        {totalPages > 1 && (

          <div className="
            px-5
            py-4
            border-t
            border-[#E8DFFF]
            bg-[#FCFAFF]
            flex
            justify-between
            items-center
            text-xs
            text-[#8875A8]
          ">

            <span>
              Showing{' '}
              {((currentPage - 1) *
                itemsPerPage) + 1}
              {' '}–{' '}
              {Math.min(
                currentPage *
                  itemsPerPage,
                sortedEmployees.length
              )}
              {' '}of{' '}
              {sortedEmployees.length}
            </span>

            <div className="flex items-center gap-3">

              <button
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="
                  p-2
                  bg-white
                  border
                  rounded-lg
                  disabled:opacity-30
                "
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                className="
                  p-2
                  bg-white
                  border
                  rounded-lg
                  disabled:opacity-30
                "
              >
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </div>

        )}

      </div>

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() =>
            setSelectedEmployee(null)
          }
        />
      )}

    </div>
  );
};