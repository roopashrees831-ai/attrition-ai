import numpy as np
import pandas as pd
from pathlib import Path


# ============================================================
# SETTINGS
# ============================================================

np.random.seed(42)

ROWS = 1000

BASE_DIR = Path(__file__).resolve().parent

OUTPUT_PATH = (
    BASE_DIR
    / "data"
    / "uploads"
    / "employee_attrition_dataset.csv"
)


# ============================================================
# BASIC EMPLOYEE DATA
# ============================================================

employee_id = [
    f"NT{1001 + i}"
    for i in range(ROWS)
]


age = np.random.randint(
    21,
    59,
    ROWS
)


gender = np.random.choice(
    ["Male", "Female"],
    size=ROWS,
    p=[0.52, 0.48]
)


marital_status = np.random.choice(
    [
        "Single",
        "Married",
        "Divorced"
    ],
    size=ROWS,
    p=[
        0.34,
        0.54,
        0.12
    ]
)


department = np.random.choice(
    [
        "Engineering",
        "Sales",
        "Human Resources",
        "Finance",
        "Operations",
        "Marketing"
    ],
    size=ROWS,
    p=[
        0.30,
        0.20,
        0.10,
        0.12,
        0.18,
        0.10
    ]
)


job_roles = {
    "Engineering": [
        "Software Engineer",
        "Data Analyst",
        "QA Engineer",
        "DevOps Engineer"
    ],

    "Sales": [
        "Sales Executive",
        "Account Manager",
        "Sales Representative"
    ],

    "Human Resources": [
        "HR Executive",
        "HR Manager",
        "Recruiter"
    ],

    "Finance": [
        "Financial Analyst",
        "Accountant",
        "Finance Manager"
    ],

    "Operations": [
        "Operations Executive",
        "Operations Manager",
        "Support Specialist"
    ],

    "Marketing": [
        "Marketing Executive",
        "Digital Marketer",
        "Marketing Manager"
    ]
}


job_role = [
    np.random.choice(
        job_roles[dept]
    )
    for dept in department
]


# ============================================================
# JOB LEVEL
# ============================================================

job_level = np.random.choice(
    [
        1,
        2,
        3,
        4,
        5
    ],
    size=ROWS,
    p=[
        0.30,
        0.30,
        0.22,
        0.13,
        0.05
    ]
)


# ============================================================
# MONTHLY INCOME
# ============================================================

income_base = {
    1: 3500,
    2: 6500,
    3: 10000,
    4: 15000,
    5: 22000
}


monthly_income = np.array([
    income_base[level]
    +
    np.random.normal(
        0,
        income_base[level] * 0.18
    )
    for level in job_level
])


monthly_income = np.clip(
    monthly_income,
    2500,
    30000
).astype(int)


# ============================================================
# HOURLY RATE
# ============================================================

hourly_rate = np.random.randint(
    30,
    101,
    ROWS
)


# ============================================================
# COMPANY EXPERIENCE
# ============================================================

max_years = np.maximum(
    age - 20,
    1
)


years_at_company = np.array([
    np.random.randint(
        0,
        min(
            int(max_year),
            20
        ) + 1
    )
    for max_year in max_years
])


years_in_current_role = np.array([
    np.random.randint(
        0,
        min(
            int(year),
            10
        ) + 1
    )
    if year > 0
    else 0
    for year in years_at_company
])


years_since_last_promotion = np.array([
    np.random.randint(
        0,
        min(
            int(year),
            8
        ) + 1
    )
    if year > 0
    else 0
    for year in years_at_company
])


# ============================================================
# WORKPLACE SATISFACTION VARIABLES
# ============================================================

work_life_balance = np.random.choice(
    [
        1,
        2,
        3,
        4
    ],
    size=ROWS,
    p=[
        0.12,
        0.24,
        0.42,
        0.22
    ]
)


job_satisfaction = np.random.choice(
    [
        1,
        2,
        3,
        4,
        5
    ],
    size=ROWS,
    p=[
        0.10,
        0.16,
        0.28,
        0.30,
        0.16
    ]
)


performance_rating = np.random.choice(
    [
        1,
        2,
        3,
        4,
        5
    ],
    size=ROWS,
    p=[
        0.03,
        0.08,
        0.48,
        0.33,
        0.08
    ]
)


training_hours_last_year = np.random.randint(
    5,
    81,
    ROWS
)


# ============================================================
# OVERTIME
# ============================================================

overtime = np.random.choice(
    [
        "No",
        "Yes"
    ],
    size=ROWS,
    p=[
        0.68,
        0.32
    ]
)


# ============================================================
# WORKLOAD
# ============================================================

project_count = np.random.randint(
    1,
    9,
    ROWS
)


average_hours = (
    38
    +
    project_count * 1.2
    +
    np.where(
        overtime == "Yes",
        8,
        0
    )
    +
    np.random.normal(
        0,
        3,
        ROWS
    )
)


average_hours = np.clip(
    average_hours,
    32,
    65
).round(1)


# ============================================================
# ABSENTEEISM
# ============================================================

absenteeism = np.random.poisson(
    4,
    ROWS
)


absenteeism = np.clip(
    absenteeism,
    0,
    25
)


# ============================================================
# ENVIRONMENT SATISFACTION
# ============================================================

work_environment_satisfaction = (
    np.random.choice(
        [
            1,
            2,
            3,
            4,
            5
        ],
        size=ROWS,
        p=[
            0.08,
            0.15,
            0.30,
            0.31,
            0.16
        ]
    )
)


# ============================================================
# MANAGER RELATIONSHIP
# ============================================================

relationship_with_manager = (
    np.random.choice(
        [
            1,
            2,
            3,
            4,
            5
        ],
        size=ROWS,
        p=[
            0.07,
            0.14,
            0.30,
            0.32,
            0.17
        ]
    )
)


# ============================================================
# JOB INVOLVEMENT
# ============================================================

job_involvement = np.random.choice(
    [
        1,
        2,
        3,
        4
    ],
    size=ROWS,
    p=[
        0.08,
        0.22,
        0.46,
        0.24
    ]
)


# ============================================================
# DISTANCE FROM HOME
# ============================================================

distance_from_home = np.random.randint(
    1,
    41,
    ROWS
)


# ============================================================
# NUMBER OF PREVIOUS COMPANIES
# ============================================================

number_of_companies_worked = np.random.choice(
    range(0, 9),
    size=ROWS,
    p=[
        0.18,
        0.19,
        0.18,
        0.15,
        0.11,
        0.08,
        0.05,
        0.035,
        0.025
    ]
)


# ============================================================
# ATTRITION PROBABILITY
#
# IMPORTANT:
# This is SIMULATED DATA for the NovaTech demo workspace.
# It is not real company employee data.
#
# We intentionally create meaningful workplace relationships
# so the ML model can learn sensible what-if behaviour.
# ============================================================

logit = np.full(
    ROWS,
    -2.15
)


# ------------------------------------------------------------
# WORK-LIFE BALANCE
# Lower balance -> more attrition tendency
# ------------------------------------------------------------

logit += (
    3 -
    work_life_balance
) * 0.42


# ------------------------------------------------------------
# JOB SATISFACTION
# Lower satisfaction -> more attrition tendency
# ------------------------------------------------------------

logit += (
    3 -
    job_satisfaction
) * 0.30


# ------------------------------------------------------------
# OVERTIME
# ------------------------------------------------------------

logit += np.where(
    overtime == "Yes",
    0.85,
    0
)


# ------------------------------------------------------------
# WORK ENVIRONMENT
# ------------------------------------------------------------

logit += (
    3 -
    work_environment_satisfaction
) * 0.25


# ------------------------------------------------------------
# RELATIONSHIP WITH MANAGER
# ------------------------------------------------------------

logit += (
    3 -
    relationship_with_manager
) * 0.24


# ------------------------------------------------------------
# JOB INVOLVEMENT
# ------------------------------------------------------------

logit += (
    3 -
    job_involvement
) * 0.24


# ------------------------------------------------------------
# INCOME
#
# Lower income relative to overall distribution increases risk.
# ------------------------------------------------------------

income_scaled = (
    monthly_income -
    monthly_income.mean()
) / monthly_income.std()


logit += (
    -0.28 *
    income_scaled
)


# ------------------------------------------------------------
# LONG WORKING HOURS
# ------------------------------------------------------------

logit += np.maximum(
    average_hours -
    45,
    0
) * 0.045


# ------------------------------------------------------------
# ABSENTEEISM
# ------------------------------------------------------------

logit += np.maximum(
    absenteeism -
    4,
    0
) * 0.075


# ------------------------------------------------------------
# DISTANCE FROM HOME
# ------------------------------------------------------------

logit += np.maximum(
    distance_from_home -
    15,
    0
) * 0.018


# ------------------------------------------------------------
# LONG TIME WITHOUT PROMOTION
# ------------------------------------------------------------

logit += np.maximum(
    years_since_last_promotion -
    3,
    0
) * 0.08


# ------------------------------------------------------------
# MORE PREVIOUS COMPANIES
# ------------------------------------------------------------

logit += np.maximum(
    number_of_companies_worked -
    3,
    0
) * 0.08


# ------------------------------------------------------------
# PROBABILITY
# ------------------------------------------------------------

attrition_probability = (
    1 /
    (
        1 +
        np.exp(
            -logit
        )
    )
)


attrition = np.where(
    np.random.random(
        ROWS
    ) <
    attrition_probability,
    "Yes",
    "No"
)


# ============================================================
# DATAFRAME
# ============================================================

df = pd.DataFrame({

    "Employee_ID":
        employee_id,

    "Age":
        age,

    "Gender":
        gender,

    "Marital_Status":
        marital_status,

    "Department":
        department,

    "Job_Role":
        job_role,

    "Job_Level":
        job_level,

    "Monthly_Income":
        monthly_income,

    "Hourly_Rate":
        hourly_rate,

    "Years_at_Company":
        years_at_company,

    "Years_in_Current_Role":
        years_in_current_role,

    "Years_Since_Last_Promotion":
        years_since_last_promotion,

    "Work_Life_Balance":
        work_life_balance,

    "Job_Satisfaction":
        job_satisfaction,

    "Performance_Rating":
        performance_rating,

    "Training_Hours_Last_Year":
        training_hours_last_year,

    "Overtime":
        overtime,

    "Project_Count":
        project_count,

    "Average_Hours_Worked_Per_Week":
        average_hours,

    "Absenteeism":
        absenteeism,

    "Work_Environment_Satisfaction":
        work_environment_satisfaction,

    "Relationship_with_Manager":
        relationship_with_manager,

    "Job_Involvement":
        job_involvement,

    "Distance_From_Home":
        distance_from_home,

    "Number_of_Companies_Worked":
        number_of_companies_worked,

    "Attrition":
        attrition
})


# ============================================================
# SAVE
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


df.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# VERIFY GENERATED DATA
# ============================================================

print()
print(
    "=" * 65
)

print(
    "NOVATECH SIMULATED ATTRITION DATASET CREATED"
)

print(
    "=" * 65
)

print(
    f"Saved to: {OUTPUT_PATH}"
)

print(
    f"Employees: {len(df)}"
)


print()
print(
    "Overall Attrition:"
)

print(
    df["Attrition"]
    .value_counts(
        normalize=True
    )
    .mul(100)
    .round(2)
)


print()
print(
    "Work-Life Balance vs Attrition:"
)

print(
    pd.crosstab(
        df[
            "Work_Life_Balance"
        ],
        df[
            "Attrition"
        ],
        normalize="index"
    )
    .mul(100)
    .round(2)
)


print()
print(
    "Job Satisfaction vs Attrition:"
)

print(
    pd.crosstab(
        df[
            "Job_Satisfaction"
        ],
        df[
            "Attrition"
        ],
        normalize="index"
    )
    .mul(100)
    .round(2)
)


print()
print(
    "Overtime vs Attrition:"
)

print(
    pd.crosstab(
        df[
            "Overtime"
        ],
        df[
            "Attrition"
        ],
        normalize="index"
    )
    .mul(100)
    .round(2)
)


print()
print(
    "Average Monthly Income:"
)

print(
    df.groupby(
        "Attrition"
    )[
        "Monthly_Income"
    ]
    .mean()
    .round(2)
)


print()
print(
    "=" * 65
)

print(
    "NOTE: This dataset is simulated for the NovaTech demo."
)

print(
    "=" * 65
)