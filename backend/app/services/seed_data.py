import os
import shutil
import pandas as pd

from app.database import engine, Base, SessionLocal
from app.models.schema import (
    Company,
    User,
    Dataset,
    TrainedModel,
    EmployeePrediction
)
from app.security import get_password_hash
from app.services.ml_engine import (
    preprocess_and_train_models,
    batch_predict
)
from app.config import settings


# ============================================================
# 3 COMPANIES - ALL USING KAGGLE DATASETS
# ============================================================

DEMO_COMPANIES = [
    {
        "name": "IBM HR Analytics",
        "industry": "Technology & Research",
        "email": "demo@ibm-hr.local",
        "password": "demo-access",

        "filename": "WA_Fn-UseC_-HR-Employee-Attrition.csv",

        "profile": "ibm",
        "source": "Kaggle"
    },

    {
        "name": "NovaTech Solutions",
        "industry": "Enterprise Software",
        "email": "demo@novatech.local",
        "password": "demo-access",

        "filename": "employee_attrition_dataset.csv",

        "profile": "novatech",
        "source": "Kaggle"
    },

    {
        "name": "Lavender Systems",
        "industry": "AI & Cloud Services",
        "email": "hr@lavendersystems.com",
        "password": "Lavender@2026",

        "filename": "HR_Attrition_Indian_Dataset.csv",

        "profile": "lavender",
        "source": "Kaggle"
    }
]


# ============================================================
# COMMON COLUMNS USED BY OUR APPLICATION
# ============================================================

COMMON_COLUMNS = [
    "EmployeeNumber",
    "Age",
    "Gender",
    "Department",
    "JobRole",
    "MonthlyIncome",
    "JobSatisfaction",
    "WorkLifeBalance",
    "OverTime",
    "YearsAtCompany",
    "DistanceFromHome",
    "PerformanceRating",
    "Attrition"
]


# ============================================================
# YES / NO CLEANING
# ============================================================

def normalize_yes_no(series):

    def convert(value):

        value = str(value).strip().lower()

        if value in [
            "yes",
            "y",
            "true",
            "1",
            "left",
            "attrited"
        ]:
            return "Yes"

        if value in [
            "no",
            "n",
            "false",
            "0",
            "stayed",
            "retained"
        ]:
            return "No"

        return str(value).strip()

    return series.apply(convert)


# ============================================================
# CLEAN NUMERIC COLUMNS
# ============================================================

def clean_numeric_columns(df):

    numeric_columns = [
        "Age",
        "MonthlyIncome",
        "JobSatisfaction",
        "WorkLifeBalance",
        "YearsAtCompany",
        "DistanceFromHome",
        "PerformanceRating"
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    return df


# ============================================================
# IBM KAGGLE DATASET
# ============================================================

def normalize_ibm(df):

    print(
        "[INFO] Preparing IBM Kaggle dataset..."
    )

    df = df.copy()

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]


    required = [
        "EmployeeNumber",
        "Age",
        "Gender",
        "Department",
        "JobRole",
        "MonthlyIncome",
        "JobSatisfaction",
        "WorkLifeBalance",
        "OverTime",
        "YearsAtCompany",
        "DistanceFromHome",
        "PerformanceRating",
        "Attrition"
    ]


    missing = [
        column
        for column in required
        if column not in df.columns
    ]


    if missing:

        raise ValueError(
            f"IBM dataset missing columns: {missing}"
        )


    df = df[
        required
    ].copy()


    df["Attrition"] = normalize_yes_no(
        df["Attrition"]
    )


    df["OverTime"] = normalize_yes_no(
        df["OverTime"]
    )


    df = clean_numeric_columns(
        df
    )


    return df


# ============================================================
# NOVATECH KAGGLE DATASET
# employee_attrition_dataset.csv
# ============================================================

def normalize_novatech(df):

    print(
        "[INFO] Preparing NovaTech Kaggle dataset..."
    )


    df = df.copy()


    df.columns = [
        str(column).strip()
        for column in df.columns
    ]


    # Convert Kaggle column names
    # into names used by our application.
    rename_map = {

        "Employee_ID":
            "EmployeeNumber",

        "Job_Role":
            "JobRole",

        "Monthly_Income":
            "MonthlyIncome",

        "Years_at_Company":
            "YearsAtCompany",

        "Work_Life_Balance":
            "WorkLifeBalance",

        "Job_Satisfaction":
            "JobSatisfaction",

        "Performance_Rating":
            "PerformanceRating",

        "Distance_From_Home":
            "DistanceFromHome",

        "Overtime":
            "OverTime"
    }


    df = df.rename(
        columns=rename_map
    )


    required = [
        "EmployeeNumber",
        "Age",
        "Gender",
        "Department",
        "JobRole",
        "MonthlyIncome",
        "JobSatisfaction",
        "WorkLifeBalance",
        "OverTime",
        "YearsAtCompany",
        "DistanceFromHome",
        "PerformanceRating",
        "Attrition"
    ]


    missing = [
        column
        for column in required
        if column not in df.columns
    ]


    if missing:

        raise ValueError(
            "NovaTech Kaggle dataset "
            f"is missing columns: {missing}"
        )


    df = df[
        required
    ].copy()


    df["Attrition"] = normalize_yes_no(
        df["Attrition"]
    )


    df["OverTime"] = normalize_yes_no(
        df["OverTime"]
    )


    df = clean_numeric_columns(
        df
    )


    return df


# ============================================================
# LAVENDER KAGGLE DATASET
# HR_Attrition_Indian_Dataset.csv
# ============================================================

def normalize_lavender(df):

    print(
        "[INFO] Preparing Lavender Kaggle dataset..."
    )


    df = df.copy()


    df.columns = [
        str(column).strip()
        for column in df.columns
    ]


    # Map Indian HR dataset columns
    # into the common application format.
    rename_map = {

        "EmployeeID":
            "EmployeeNumber",

        "Designation":
            "JobRole",

        "MonthlySalary":
            "MonthlyIncome",

        "YearsWithCompany":
            "YearsAtCompany",

        "DoesOvertime":
            "OverTime",

        "AppraisalRating":
            "PerformanceRating",

        "LeftCompany":
            "Attrition"
    }


    df = df.rename(
        columns=rename_map
    )


    required = [
        "EmployeeNumber",
        "Age",
        "Gender",
        "Department",
        "JobRole",
        "MonthlyIncome",
        "JobSatisfaction",
        "WorkLifeBalance",
        "OverTime",
        "YearsAtCompany",
        "DistanceFromHome",
        "PerformanceRating",
        "Attrition"
    ]


    missing = [
        column
        for column in required
        if column not in df.columns
    ]


    if missing:

        raise ValueError(
            "Lavender Kaggle dataset "
            f"is missing columns: {missing}"
        )


    df = df[
        required
    ].copy()


    df["Attrition"] = normalize_yes_no(
        df["Attrition"]
    )


    df["OverTime"] = normalize_yes_no(
        df["OverTime"]
    )


    df = clean_numeric_columns(
        df
    )


    return df


# ============================================================
# NORMALIZE DATASET BASED ON COMPANY
# ============================================================

def normalize_dataset(
    df,
    profile
):

    if profile == "ibm":

        return normalize_ibm(
            df
        )


    if profile == "novatech":

        return normalize_novatech(
            df
        )


    if profile == "lavender":

        return normalize_lavender(
            df
        )


    raise ValueError(
        f"Unknown dataset profile: {profile}"
    )


# ============================================================
# LOAD KAGGLE CSV
# ============================================================

def load_company_dataset(
    company_info
):

    filename = company_info[
        "filename"
    ]


    filepath = os.path.join(
        settings.UPLOAD_DIR,
        filename
    )


    # Make sure file really exists
    if not os.path.exists(
        filepath
    ):

        raise FileNotFoundError(
            "\nDataset not found.\n"
            f"Company: {company_info['name']}\n"
            f"Expected file: {filepath}\n"
        )


    print(
        f"\n[INFO] Loading "
        f"{company_info['name']}..."
    )


    print(
        f"[INFO] File: {filename}"
    )


    # Read actual Kaggle CSV
    df = pd.read_csv(
        filepath
    )


    # Remove totally empty rows
    df = df.dropna(
        how="all"
    )


    # Remove duplicate rows
    df = df.drop_duplicates()


    df = df.reset_index(
        drop=True
    )


    # Convert different Kaggle schemas
    # into common application schema
    df = normalize_dataset(
        df,
        company_info[
            "profile"
        ]
    )


    # Remove rows without Attrition
    df = df.dropna(
        subset=[
            "Attrition"
        ]
    )


    # Fill missing numeric values
    numeric_columns = [
        "Age",
        "MonthlyIncome",
        "JobSatisfaction",
        "WorkLifeBalance",
        "YearsAtCompany",
        "DistanceFromHome",
        "PerformanceRating"
    ]


    for column in numeric_columns:

        if df[column].isnull().any():

            median_value = df[
                column
            ].median()


            df[column] = df[
                column
            ].fillna(
                median_value
            )


    # Fill missing categorical values
    categorical_columns = [
        "Gender",
        "Department",
        "JobRole",
        "OverTime"
    ]


    for column in categorical_columns:

        df[column] = df[
            column
        ].fillna(
            "Unknown"
        )


    # Verify target contains both classes
    target_values = set(
        df["Attrition"]
        .astype(str)
        .str.lower()
        .unique()
    )


    if not (
        "yes" in target_values
        and
        "no" in target_values
    ):

        raise ValueError(
            f"{company_info['name']} dataset "
            "must contain both Yes and No "
            "Attrition records."
        )


    print(
        f"[SUCCESS] {company_info['name']} "
        f"loaded with {len(df)} employees."
    )


    return (
        df,
        filepath
    )


# ============================================================
# DATABASE RESET CHECK
# ============================================================

def database_needs_reset(
    db
):

    companies = db.query(
        Company
    ).all()


    # Fresh database
    if not companies:

        return False


    wanted_company_names = {

        company[
            "name"
        ]

        for company
        in DEMO_COMPANIES
    }


    existing_company_names = {

        company.company_name

        for company
        in companies
    }


    # Company names changed
    if (
        existing_company_names
        !=
        wanted_company_names
    ):

        return True


    # Check each company dataset filename
    for company_info in DEMO_COMPANIES:

        company = db.query(
            Company
        ).filter(

            Company.company_name
            ==
            company_info[
                "name"
            ]

        ).first()


        if not company:

            return True


        dataset = db.query(
            Dataset
        ).filter(

            Dataset.company_id
            ==
            company.id

        ).first()


        if not dataset:

            return True


        if (
            dataset.filename
            !=
            company_info[
                "filename"
            ]
        ):

            print(
                f"[INFO] New Kaggle dataset detected "
                f"for {company_info['name']}."
            )

            return True


    return False


# ============================================================
# RESET OLD DATABASE
# ============================================================

def reset_database():

    print(
        "\n[INFO] Rebuilding database "
        "for Kaggle datasets..."
    )


    # Remove database tables
    Base.metadata.drop_all(
        bind=engine
    )


    # Recreate tables
    Base.metadata.create_all(
        bind=engine
    )


    # Delete old trained model folders
    if os.path.isdir(
        settings.MODEL_DIR
    ):

        for item in os.listdir(
            settings.MODEL_DIR
        ):

            item_path = os.path.join(
                settings.MODEL_DIR,
                item
            )


            if (
                os.path.isdir(
                    item_path
                )
                and
                item.startswith(
                    "company_"
                )
            ):

                shutil.rmtree(
                    item_path,
                    ignore_errors=True
                )


    print(
        "[SUCCESS] Old database/models cleared."
    )


# ============================================================
# CREATE DATASET RECORD
# ============================================================

def create_dataset_record(
    db,
    company,
    company_info,
    df,
    filepath
):

    dataset = Dataset(

        company_id=
            company.id,

        filename=
            company_info[
                "filename"
            ],

        filepath=
            filepath,

        row_count=
            len(df),

        col_count=
            len(df.columns),

        target_col=
            "Attrition",

        data_summary={

            "rows":
                len(df),

            "cols":
                len(
                    df.columns
                ),

            "missing_values":
                int(
                    df.isnull()
                    .sum()
                    .sum()
                ),

            "duplicate_rows":
                int(
                    df.duplicated()
                    .sum()
                ),

            "target_col":
                "Attrition",

            "source":
                "Kaggle",

            "original_file":
                company_info[
                    "filename"
                ]
        },

        is_active=True
    )


    db.add(
        dataset
    )


    db.commit()


    db.refresh(
        dataset
    )


    return dataset


# ============================================================
# TRAIN COMPANY MODEL
# ============================================================

def train_company_model(
    db,
    company,
    dataset,
    df
):

    company_model_directory = os.path.join(

        settings.MODEL_DIR,

        f"company_{company.id}"
    )


    # Clear previous model
    if os.path.isdir(
        company_model_directory
    ):

        shutil.rmtree(
            company_model_directory,
            ignore_errors=True
        )


    print(
        f"[INFO] Training ML models for "
        f"{company.company_name}..."
    )


    training_results = (
        preprocess_and_train_models(

            df=df,

            target_col=
                "Attrition",

            column_mapping=
                {},

            model_save_dir=
                company_model_directory
        )
    )


    for result in training_results[
        "all_results"
    ]:

        model_record = TrainedModel(

            company_id=
                company.id,

            dataset_id=
                dataset.id,

            model_name=
                result[
                    "model_name"
                ],

            is_best=
                result[
                    "is_best"
                ],

            accuracy=
                result[
                    "accuracy"
                ],

            precision=
                result[
                    "precision"
                ],

            recall=
                result[
                    "recall"
                ],

            f1_score=
                result[
                    "f1_score"
                ],

            roc_auc=
                result[
                    "roc_auc"
                ],

            metrics_json={

                "confusion_matrix":
                    result[
                        "confusion_matrix"
                    ],

                "all_results":
                    training_results[
                        "all_results"
                    ]
            },

            feature_importance_json=
                result[
                    "feature_importances"
                ],

            trained_filepath=
                training_results[
                    "best_model_path"
                ]
        )


        db.add(
            model_record
        )


    db.commit()


    print(
        f"[SUCCESS] Best model: "
        f"{training_results['best_model_name']}"
    )


    return training_results


# ============================================================
# CREATE EMPLOYEE PREDICTIONS
# ============================================================

def create_employee_predictions(
    db,
    company,
    dataset,
    df,
    model_path
):

    print(
        f"[INFO] Creating predictions for "
        f"{company.company_name}..."
    )


    predictions = batch_predict(

        df=df,

        model_path=
            model_path,

        column_mapping={}
    )


    for prediction in predictions:

        prediction_record = EmployeePrediction(

            company_id=
                company.id,

            dataset_id=
                dataset.id,

            employee_id=
                prediction[
                    "employee_id"
                ],

            department=
                prediction[
                    "department"
                ],

            job_role=
                prediction[
                    "job_role"
                ],

            monthly_income=
                prediction[
                    "monthly_income"
                ],

            job_satisfaction=
                prediction[
                    "job_satisfaction"
                ],

            overtime=
                prediction[
                    "overtime"
                ],

            work_life_balance=
                prediction[
                    "work_life_balance"
                ],

            years_at_company=
                prediction[
                    "years_at_company"
                ],

            distance_from_home=
                prediction[
                    "distance_from_home"
                ],

            raw_data=
                prediction[
                    "raw_data"
                ],

            probability=
                prediction[
                    "probability"
                ],

            risk_level=
                prediction[
                    "risk_level"
                ],

            top_risk_factors=
                prediction[
                    "top_risk_factors"
                ],

            recommendations=
                prediction[
                    "recommendations"
                ]
        )


        db.add(
            prediction_record
        )


    db.commit()


    print(
        f"[SUCCESS] {len(predictions)} "
        f"employee predictions created."
    )


# ============================================================
# SEED DATABASE
# ============================================================

def seed_database():

    Base.metadata.create_all(
        bind=engine
    )


    db = SessionLocal()


    try:

        # ====================================================
        # RESET IF OLD DATASET EXISTS
        # ====================================================

        if database_needs_reset(
            db
        ):

            db.close()


            reset_database()


            db = SessionLocal()


        existing_companies = db.query(
            Company
        ).all()


        # Already finished previously
        if len(
            existing_companies
        ) == 3:

            existing_names = {

                company.company_name

                for company
                in existing_companies
            }


            expected_names = {

                company[
                    "name"
                ]

                for company
                in DEMO_COMPANIES
            }


            if (
                existing_names
                ==
                expected_names
            ):

                print(
                    "[INFO] All 3 Kaggle company "
                    "datasets are already loaded."
                )

                return


        print(
            "\n========================================"
        )

        print(
            " ATTRITION AI - KAGGLE DATASET SETUP"
        )

        print(
            "========================================"
        )


        # ====================================================
        # CREATE ALL THREE COMPANIES
        # ====================================================

        for company_info in DEMO_COMPANIES:

            print(
                "\n----------------------------------------"
            )

            print(
                f" Company: "
                f"{company_info['name']}"
            )

            print(
                f" Dataset: "
                f"{company_info['filename']}"
            )

            print(
                " Source: Kaggle"
            )

            print(
                "----------------------------------------"
            )


            # =================================================
            # CREATE COMPANY
            # =================================================

            company = Company(

                company_name=
                    company_info[
                        "name"
                    ],

                industry=
                    company_info[
                        "industry"
                    ]
            )


            db.add(
                company
            )


            db.commit()


            db.refresh(
                company
            )


            # =================================================
            # CREATE LOGIN USER
            # =================================================

            user = User(

                company_id=
                    company.id,

                name=
                    f"{company_info['name']} HR Admin",

                email=
                    company_info[
                        "email"
                    ],

                password_hash=
                    get_password_hash(
                        company_info[
                            "password"
                        ]
                    ),

                role="admin"
            )


            db.add(
                user
            )


            db.commit()


            # =================================================
            # LOAD REAL KAGGLE FILE
            # =================================================

            df, filepath = (
                load_company_dataset(
                    company_info
                )
            )


            # =================================================
            # SAVE DATASET INFO
            # =================================================

            dataset = (
                create_dataset_record(

                    db=
                        db,

                    company=
                        company,

                    company_info=
                        company_info,

                    df=
                        df,

                    filepath=
                        filepath
                )
            )


            # =================================================
            # TRAIN ML MODELS
            # =================================================

            training_results = (
                train_company_model(

                    db=
                        db,

                    company=
                        company,

                    dataset=
                        dataset,

                    df=
                        df
                )
            )


            # =================================================
            # GENERATE PREDICTIONS
            # =================================================

            create_employee_predictions(

                db=
                    db,

                company=
                    company,

                dataset=
                    dataset,

                df=
                    df,

                model_path=
                    training_results[
                        "best_model_path"
                    ]
            )


            print(
                f"\n[SUCCESS] "
                f"{company.company_name}"
            )

            print(
                f"          Kaggle rows: "
                f"{len(df)}"
            )

            print(
                f"          Model: "
                f"{training_results['best_model_name']}"
            )


        print(
            "\n========================================"
        )

        print(
            " ALL 3 KAGGLE DATASETS ARE READY"
        )

        print(
            "========================================"
        )

        print(
            "\nIBM      -> "
            "WA_Fn-UseC_-HR-Employee-Attrition.csv"
        )

        print(
            "NovaTech -> "
            "employee_attrition_dataset.csv"
        )

        print(
            "Lavender -> "
            "HR_Attrition_Indian_Dataset.csv"
        )


    except Exception as error:

        db.rollback()


        print(
            "\n[ERROR] Setup failed:"
        )

        print(
            str(error)
        )


        raise


    finally:

        try:

            db.close()

        except Exception:

            pass


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    seed_database()