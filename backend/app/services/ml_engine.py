import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

CANONICAL_COLUMNS = {
    "attrition": ["attrition", "attrition_status", "left", "turnover", "status", "is_left", "exit"],
    "age": ["age", "employee_age"],
    "gender": ["gender", "sex"],
    "department": ["department", "dept", "division"],
    "job_role": ["jobrole", "job_role", "role", "position", "title"],
    "monthly_income": ["monthlyincome", "monthly_income", "salary", "income", "pay"],
    "job_satisfaction": ["jobsatisfaction", "job_satisfaction", "satisfaction_level", "satisfaction"],
    "work_life_balance": ["worklifebalance", "work_life_balance", "work_life"],
    "overtime": ["overtime", "over_time", "working_overtime"],
    "years_at_company": ["yearsatcompany", "years_at_company", "tenure"],
    "job_level": ["joblevel", "job_level", "grade", "level"],
    "performance_rating": ["performancerating", "performance_rating", "performance"],
    "distance_from_home": ["distancefromhome", "distance_from_home", "distance", "commute_distance"],
    "environment_satisfaction": ["environmentsatisfaction", "environment_satisfaction"],
    "relationship_satisfaction": ["relationshipsatisfaction", "relationship_satisfaction"]
}

def detect_column_mappings(df: pd.DataFrame) -> Tuple[str, Dict[str, str]]:
    """
    Intelligently suggest canonical mapping for columns in uploaded CSV
    """
    suggested_target = ""
    col_mapping = {}

    df_cols_clean = {col: col.strip().lower().replace(" ", "").replace("_", "").replace("-", "") for col in df.columns}

    # Find target column
    for original_col, clean_col in df_cols_clean.items():
        for target_alias in CANONICAL_COLUMNS["attrition"]:
            if target_alias.replace("_", "") in clean_col:
                suggested_target = original_col
                break
        if suggested_target:
            break

    # If no exact match, look for column with binary/low unique values like 'Yes'/'No' or 'Left'/'Stayed'
    if not suggested_target:
        for col in df.columns:
            uniques = set(df[col].dropna().astype(str).str.lower().unique())
            if uniques.issubset({"yes", "no", "true", "false", "1", "0", "left", "stayed", "retained", "attrited"}):
                suggested_target = col
                break

    if not suggested_target and len(df.columns) > 0:
        suggested_target = df.columns[-1] # fallback to last column

    # Find feature mappings
    for canonical_key, aliases in CANONICAL_COLUMNS.items():
        if canonical_key == "attrition":
            continue
        mapped_col = ""
        for original_col, clean_col in df_cols_clean.items():
            if original_col == suggested_target:
                continue
            for alias in aliases:
                if alias.replace("_", "") in clean_col:
                    mapped_col = original_col
                    break
            if mapped_col:
                break
        if mapped_col:
            col_mapping[mapped_col] = canonical_key.replace("_", " ").title()

    return suggested_target, col_mapping

def preprocess_and_train_models(
    df: pd.DataFrame,
    target_col: str,
    column_mapping: Dict[str, str],
    model_save_dir: str
) -> Dict[str, Any]:
    """
    Full AutoML training pipeline:
    1. Rename & Clean DataFrame
    2. Convert Target to 0/1
    3. Separate Features & Target
    4. Fit Preprocessing Pipeline (Imputer + Scaler + OneHotEncoder)
    5. Train Logistic Regression, Random Forest, Gradient Boosting
    6. Compare & Pick Best Model based on ROC-AUC / F1
    7. Return evaluation metrics and feature importances
    """
    df = df.copy()

    # Map column names if mapped
    if column_mapping:
        df = df.rename(columns=column_mapping)

    # Re-identify target column in case it was mapped
    actual_target = column_mapping.get(target_col, target_col)
    if actual_target not in df.columns:
        raise ValueError(f"Target column '{actual_target}' not found in dataset columns.")

    # Drop columns that are IDs or unique per row
    drop_cols = []
    for col in df.columns:
        if col != actual_target:
            clean_name = str(col).lower()
            if "id" in clean_name or "employee_number" in clean_name or "number" in clean_name and df[col].nunique() > 0.9 * len(df):
                drop_cols.append(col)
    if drop_cols:
        df = df.drop(columns=drop_cols)

    # Encode Target Column to 0 and 1
    y_raw = df[actual_target].dropna()
    y_str = y_raw.astype(str).str.strip().str.lower()
    
    # Map Yes/True/1/Left to 1, rest to 0
    y = y_str.apply(lambda x: 1 if x in ["yes", "true", "1", "left", "exit", "attrited"] else 0)
    X = df.loc[y_raw.index].drop(columns=[actual_target])

    # Identify Numerical and Categorical columns
    num_cols = X.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()
    cat_cols = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, num_cols),
            ('cat', cat_pipeline, cat_cols)
        ]
    )

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
    )

    # Fit preprocessor
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # Get feature names post encoding
    encoded_feature_names = list(num_cols)
    if cat_cols:
        encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
        cat_feature_names = encoder.get_feature_names_out(cat_cols)
        encoded_feature_names.extend(cat_feature_names)

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    }

    results = []
    trained_artifacts = {}
    best_model_name = ""
    best_score = -1.0

    for name, clf in models.items():
        clf.fit(X_train_trans, y_train)
        y_pred = clf.predict(X_test_trans)
        
        try:
            y_prob = clf.predict_proba(X_test_trans)[:, 1]
        except AttributeError:
            y_prob = y_pred

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        try:
            auc = float(roc_auc_score(y_test, y_prob))
        except Exception:
            auc = acc

        cm = confusion_matrix(y_test, y_pred).tolist()

        # Calculate feature importances / coefficients
        feat_importances = []
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_
        elif hasattr(clf, "coef_"):
            importances = np.abs(clf.coef_[0])
        else:
            importances = np.zeros(len(encoded_feature_names))

        # Map back to original feature groups
        feature_scores = {}
        for fname, imp in zip(encoded_feature_names, importances):
            orig_name = fname.split('_')[0] if '_' in fname else fname
            feature_scores[orig_name] = feature_scores.get(orig_name, 0.0) + float(imp)

        total_score = sum(feature_scores.values()) or 1.0
        sorted_feats = sorted(
            [{"feature": k, "importance": round(v / total_score, 4)} for k, v in feature_scores.items()],
            key=lambda x: x["importance"],
            reverse=True
        )

        model_res = {
            "model_name": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm,
            "feature_importances": sorted_feats[:10]
        }

        results.append(model_res)
        trained_artifacts[name] = {
            "model": clf,
            "preprocessor": preprocessor,
            "num_cols": num_cols,
            "cat_cols": cat_cols,
            "encoded_feature_names": encoded_feature_names,
            "target_col": actual_target
        }

        # Select best model based on composite F1 & ROC-AUC score
        composite_score = (f1 + auc) / 2.0
        if composite_score > best_score:
            best_score = composite_score
            best_model_name = name

    # Save best model pipeline to disk
    os.makedirs(model_save_dir, exist_ok=True)
    best_pipeline = trained_artifacts[best_model_name]
    best_model_filename = f"best_model_{best_model_name.lower().replace(' ', '_')}.joblib"
    best_model_path = os.path.join(model_save_dir, best_model_filename)

    joblib.dump(best_pipeline, best_model_path)

    for r in results:
        r["is_best"] = (r["model_name"] == best_model_name)

    return {
        "best_model_name": best_model_name,
        "best_model_path": best_model_path,
        "all_results": results,
        "best_metrics": [r for r in results if r["is_best"]][0]
    }

def batch_predict(
    df: pd.DataFrame,
    model_path: str,
    column_mapping: Dict[str, str] = None
) -> List[Dict[str, Any]]:
    """
    Run batch inference on dataframe using saved joblib model artifact.
    Returns list of dicts with probability, risk level, risk factors, and recommendations.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    pipeline_data = joblib.load(model_path)
    model = pipeline_data["model"]
    preprocessor = pipeline_data["preprocessor"]
    target_col = pipeline_data["target_col"]

    df_clean = df.copy()
    if column_mapping:
        df_clean = df_clean.rename(columns=column_mapping)

    if target_col in df_clean.columns:
        X_df = df_clean.drop(columns=[target_col])
    else:
        X_df = df_clean

    X_trans = preprocessor.transform(X_df)

    try:
        probabilities = model.predict_proba(X_trans)[:, 1]
    except Exception:
        preds = model.predict(X_trans)
        probabilities = [0.85 if p == 1 else 0.15 for p in preds]

    predictions = []
    for idx, prob in enumerate(probabilities):
        row = df_clean.iloc[idx].to_dict()
        
        # Risk level classification
        if prob >= 0.65:
            risk_level = "HIGH"
        elif prob >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate top risk factors
        risk_factors = extract_individual_risk_factors(row, prob)
        
        # Generate recommendations
        recommendations = generate_retention_recommendations(row, prob, risk_factors)

        emp_id = str(row.get("EmployeeNumber", row.get("EmployeeID", row.get("id", idx + 1001))))
        dept = str(row.get("Department", "General"))
        role = str(row.get("JobRole", "Employee"))

        predictions.append({
            "employee_id": emp_id,
            "department": dept,
            "job_role": role,
            "monthly_income": float(row.get("MonthlyIncome", 5000)),
            "job_satisfaction": int(row.get("JobSatisfaction", 3)),
            "overtime": str(row.get("OverTime", "No")),
            "work_life_balance": int(row.get("WorkLifeBalance", 3)),
            "years_at_company": int(row.get("YearsAtCompany", 3)),
            "distance_from_home": int(row.get("DistanceFromHome", 5)),
            "probability": round(float(prob), 4),
            "risk_level": risk_level,
            "top_risk_factors": risk_factors,
            "recommendations": recommendations,
            "raw_data": {k: (v if not isinstance(v, (np.generic, pd.Timestamp)) else str(v)) for k, v in row.items()}
        })

    return predictions

def extract_individual_risk_factors(row: dict, prob: float) -> List[Dict[str, Any]]:
    """
    Explainable AI (XAI) feature attribution rules for individual employee record
    """
    factors = []

    overtime = str(row.get("OverTime", "No")).strip().lower()
    if overtime in ["yes", "1", "true"]:
        factors.append({
            "factor": "Frequent Overtime Workload",
            "impact": "High",
            "description": "Employee works overtime consistently, contributing significantly to burnout risk."
        })

    sat = float(row.get("JobSatisfaction", 3))
    if sat <= 2:
        factors.append({
            "factor": "Low Job Satisfaction Rating",
            "impact": "High",
            "description": f"Current satisfaction score is {int(sat)}/4, indicating strong disengagement."
        })

    wlb = float(row.get("WorkLifeBalance", 3))
    if wlb <= 2:
        factors.append({
            "factor": "Poor Work-Life Balance",
            "impact": "Medium",
            "description": "Work-life balance is rated low (1-2 range), increasing departure probability."
        })

    income = float(row.get("MonthlyIncome", 5000))
    if income < 4000:
        factors.append({
            "factor": "Below-Average Monthly Compensation",
            "impact": "High",
            "description": f"Monthly income (${income:,.0f}) is below department benchmark thresholds."
        })

    dist = float(row.get("DistanceFromHome", 5))
    if dist >= 15:
        factors.append({
            "factor": "Long Commute Distance",
            "impact": "Medium",
            "description": f"Commute distance of {int(dist)} miles increases fatigue and turnover likelihood."
        })

    years = float(row.get("YearsSinceLastPromotion", 0))
    if years >= 3:
        factors.append({
            "factor": "Stagnant Career Progression",
            "impact": "Medium",
            "description": f"No promotion in the last {int(years)} years may signal growth frustration."
        })

    if not factors:
        factors.append({
            "factor": "Balanced Workplace Dynamics",
            "impact": "Low",
            "description": "Key employee indicators reflect stable satisfaction and workload."
        })

    return factors[:4]

def generate_retention_recommendations(row: dict, prob: float, risk_factors: list) -> List[Dict[str, Any]]:
    """
    Generate actionable HR retention strategies tailored to employee risk profile
    """
    recs = []

    overtime = str(row.get("OverTime", "No")).strip().lower()
    sat = float(row.get("JobSatisfaction", 3))
    income = float(row.get("MonthlyIncome", 5000))
    dist = float(row.get("DistanceFromHome", 5))

    if prob >= 0.65:
        priority = "URGENT"
    elif prob >= 0.35:
        priority = "HIGH"
    else:
        priority = "STANDARD"

    if overtime in ["yes", "1", "true"]:
        recs.append({
            "priority": priority,
            "title": "Workload & Overtime Audit",
            "action": "Rebalance operational tasks, cap overtime hours, and provide temporary project support."
        })

    if sat <= 2:
        recs.append({
            "priority": priority,
            "title": "1-on-1 Executive Stay Interview",
            "action": "Schedule an open feedback session with manager within 7 days to address role expectations."
        })

    if income < 4500:
        recs.append({
            "priority": "HIGH",
            "title": "Compensation & Pay Parity Review",
            "action": "Evaluate salary against market benchmarks and explore merit adjustment or retention bonus."
        })

    if dist >= 15:
        recs.append({
            "priority": "STANDARD",
            "title": "Flexible Work Arrangements",
            "action": "Offer 2-3 hybrid work-from-home days per week to reduce commute fatigue."
        })

    recs.append({
        "priority": "STANDARD",
        "title": "Career Development Mapping",
        "action": "Define a clear 12-month promotion pathway and enroll employee in high-visibility projects."
    })

    return recs[:5]

def predict_single_employee(
    employee_input: dict,
    model_path: str,
    column_mapping: dict = None
) -> dict:
    """
    Run real-time inference on a single interactive custom employee input
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    pipeline_data = joblib.load(model_path)
    model = pipeline_data["model"]
    preprocessor = pipeline_data["preprocessor"]
    num_cols = pipeline_data["num_cols"]
    cat_cols = pipeline_data["cat_cols"]
    target_col = pipeline_data["target_col"]

    # Construct complete dictionary matching expected feature set
    row_dict = {}
    for col in num_cols:
        val = employee_input.get(col, employee_input.get(col.lower(), 0))
        row_dict[col] = float(val)
    for col in cat_cols:
        val = employee_input.get(col, employee_input.get(col.lower(), "Unknown"))
        row_dict[col] = str(val)

    df_single = pd.DataFrame([row_dict])
    X_trans = preprocessor.transform(df_single)

    try:
        prob = float(model.predict_proba(X_trans)[0, 1])
    except Exception:
        pred = model.predict(X_trans)[0]
        prob = 0.85 if pred == 1 else 0.15

    if prob >= 0.65:
        risk_level = "HIGH"
    elif prob >= 0.35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    risk_factors = extract_individual_risk_factors(row_dict, prob)
    recommendations = generate_retention_recommendations(row_dict, prob, risk_factors)

    # Calculate SHAP-like feature contributions for input
    encoded_names = pipeline_data.get("encoded_feature_names", [])
    feat_contributions = []
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_[0])
    else:
        importances = np.zeros(len(encoded_names))

    for name, imp in zip(encoded_names, importances):
        feat_contributions.append({
            "feature": name.replace("cat__", "").replace("num__", ""),
            "contribution": round(float(imp) * 100, 2)
        })

    feat_contributions = sorted(feat_contributions, key=lambda x: x["contribution"], reverse=True)[:8]

    return {
        "employee_id": str(employee_input.get("EmployeeNumber", "CUSTOM-LIVE")),
        "department": str(employee_input.get("Department", "Engineering")),
        "job_role": str(employee_input.get("JobRole", "Software Engineer")),
        "monthly_income": float(employee_input.get("MonthlyIncome", 5000)),
        "job_satisfaction": int(employee_input.get("JobSatisfaction", 3)),
        "overtime": str(employee_input.get("OverTime", "No")),
        "work_life_balance": int(employee_input.get("WorkLifeBalance", 3)),
        "years_at_company": int(employee_input.get("YearsAtCompany", 3)),
        "distance_from_home": int(employee_input.get("DistanceFromHome", 5)),
        "probability": round(prob, 4),
        "risk_level": risk_level,
        "top_risk_factors": risk_factors,
        "recommendations": recommendations,
        "feature_contributions": feat_contributions
    }

