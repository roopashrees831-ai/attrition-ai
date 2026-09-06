import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional

from sklearn.base import clone
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)


# =============================================================================
# CANONICAL COLUMN NAMES
# =============================================================================

CANONICAL_COLUMNS = {
    "attrition": [
        "attrition",
        "attrition_status",
        "left",
        "turnover",
        "status",
        "is_left",
        "exit",
    ],
    "age": ["age", "employee_age"],
    "gender": ["gender", "sex"],
    "department": ["department", "dept", "division"],
    "job_role": ["jobrole", "job_role", "role", "position", "title"],
    "monthly_income": ["monthlyincome", "monthly_income", "salary", "income", "pay"],
    "job_satisfaction": [
        "jobsatisfaction",
        "job_satisfaction",
        "satisfaction_level",
        "satisfaction",
    ],
    "work_life_balance": [
        "worklifebalance",
        "work_life_balance",
        "work_life",
    ],
    "overtime": ["overtime", "over_time", "working_overtime"],
    "years_at_company": ["yearsatcompany", "years_at_company", "tenure"],
    "job_level": ["joblevel", "job_level", "grade", "level"],
    "performance_rating": [
        "performancerating",
        "performance_rating",
        "performance",
    ],
    "distance_from_home": [
        "distancefromhome",
        "distance_from_home",
        "distance",
        "commute_distance",
    ],
    "environment_satisfaction": [
        "environmentsatisfaction",
        "environment_satisfaction",
    ],
    "relationship_satisfaction": [
        "relationshipsatisfaction",
        "relationship_satisfaction",
    ],
}


# Direct protected attributes are excluded from the prediction model.
# They can still remain in raw/display data, but should not drive HR risk scoring.
SENSITIVE_FEATURE_KEYS = {
    "age",
    "gender",
    "sex",
    "maritalstatus",
    "marital_status",
    "race",
    "ethnicity",
    "religion",
    "nationality",
    "disability",
    "pregnancy",
}


# Work-related factors that are useful for local model explanations.
EXPLAINABLE_WORK_FEATURES = {
    "overtime",
    "worklifebalance",
    "jobsatisfaction",
    "environmentsatisfaction",
    "jobinvolvement",
    "monthlyincome",
    "distancefromhome",
    "yearsatcompany",
    "yearsincurrentrole",
    "yearssincelastpromotion",
    "yearswithcurrmanager",
    "trainingtimeslastyear",
    "joblevel",
    "performancerating",
    "totalworkingyears",
}


POSITIVE_TARGET_LABELS = {
    "1",
    "yes",
    "true",
    "left",
    "leave",
    "leaver",
    "attrition",
    "attrited",
    "exit",
    "exited",
    "resigned",
    "resign",
    "turnover",
    "terminated",
}

NEGATIVE_TARGET_LABELS = {
    "0",
    "no",
    "false",
    "stay",
    "stayed",
    "retained",
    "active",
    "current",
    "employed",
    "not left",
    "not_left",
    "not attrited",
}


# =============================================================================
# GENERAL HELPERS
# =============================================================================

def _normalize_name(value: Any) -> str:
    return (
        str(value or "")
        .strip()
        .lower()
        .replace(" ", "")
        .replace("_", "")
        .replace("-", "")
    )


def _native_value(value: Any) -> Any:
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if pd.isna(value):
        return None
    return value


def _safe_float(value: Any, fallback: float) -> float:
    try:
        numeric = float(value)
        if np.isfinite(numeric):
            return numeric
    except (TypeError, ValueError):
        pass
    return float(fallback)


def _safe_int(value: Any, fallback: int) -> int:
    try:
        numeric = float(value)
        if np.isfinite(numeric):
            return int(round(numeric))
    except (TypeError, ValueError):
        pass
    return int(fallback)


def _find_existing_key(data: Dict[str, Any], wanted_key: str) -> Optional[str]:
    """
    Match an input key by exact spelling first, then by normalized spelling.
    This prevents silent 0 / 'Unknown' values when the dataset used renamed
    columns such as 'Monthly Income' instead of 'MonthlyIncome'.
    """
    if wanted_key in data:
        return wanted_key

    wanted_norm = _normalize_name(wanted_key)
    for key in data.keys():
        if _normalize_name(key) == wanted_norm:
            return key

    return None


def _get_model_probability(model: Any, X_transformed: Any) -> np.ndarray:
    if not hasattr(model, "predict_proba"):
        raise ValueError(
            "The active model does not provide predict_proba(). "
            "Real attrition probabilities cannot be generated."
        )

    probabilities = model.predict_proba(X_transformed)

    if probabilities.ndim != 2 or probabilities.shape[1] < 2:
        raise ValueError("The active model did not return binary class probabilities.")

    # Target is explicitly encoded as integer 0/1 during training.
    classes = list(getattr(model, "classes_", [0, 1]))
    if 1 in classes:
        positive_index = classes.index(1)
    else:
        positive_index = 1

    return probabilities[:, positive_index]


def _risk_level(probability: float) -> str:
    if probability >= 0.65:
        return "HIGH"
    if probability >= 0.35:
        return "MEDIUM"
    return "LOW"


# =============================================================================
# COLUMN DETECTION
# =============================================================================

def detect_column_mappings(df: pd.DataFrame) -> Tuple[str, Dict[str, str]]:
    """
    Suggest a target column and common employee-field mappings.
    """
    suggested_target = ""
    col_mapping: Dict[str, str] = {}

    df_cols_clean = {
        col: _normalize_name(col)
        for col in df.columns
    }

    for original_col, clean_col in df_cols_clean.items():
        for target_alias in CANONICAL_COLUMNS["attrition"]:
            alias_clean = _normalize_name(target_alias)
            if alias_clean == clean_col or alias_clean in clean_col:
                suggested_target = original_col
                break
        if suggested_target:
            break

    if not suggested_target:
        for col in df.columns:
            uniques = {
                str(v).strip().lower()
                for v in df[col].dropna().unique()
            }
            if uniques and uniques.issubset(
                POSITIVE_TARGET_LABELS | NEGATIVE_TARGET_LABELS
            ):
                suggested_target = col
                break

    if not suggested_target and len(df.columns) > 0:
        suggested_target = df.columns[-1]

    for canonical_key, aliases in CANONICAL_COLUMNS.items():
        if canonical_key == "attrition":
            continue

        mapped_col = ""
        for original_col, clean_col in df_cols_clean.items():
            if original_col == suggested_target:
                continue

            for alias in aliases:
                if _normalize_name(alias) == clean_col:
                    mapped_col = original_col
                    break

            if mapped_col:
                break

        if mapped_col:
            col_mapping[mapped_col] = canonical_key.replace("_", " ").title()

    return suggested_target, col_mapping


# =============================================================================
# TARGET ENCODING
# =============================================================================

def _encode_target(series: pd.Series) -> pd.Series:
    """
    Convert a supported binary attrition target into integer 0/1.

    Important:
    - We do not silently map unknown text labels to 0.
    - Both target classes must exist.
    """
    raw = series.dropna()

    if raw.empty:
        raise ValueError("The target column contains no non-empty values.")

    normalized = raw.astype(str).str.strip().str.lower()

    unknown = sorted(
        set(normalized.unique())
        - POSITIVE_TARGET_LABELS
        - NEGATIVE_TARGET_LABELS
    )

    if unknown:
        raise ValueError(
            "Unsupported attrition target labels: "
            + ", ".join(map(str, unknown[:12]))
            + ". Expected labels such as Yes/No, Left/Stayed, True/False, or 1/0."
        )

    y = normalized.map(
        lambda value: 1 if value in POSITIVE_TARGET_LABELS else 0
    ).astype(int)

    counts = y.value_counts()

    if len(counts) != 2:
        raise ValueError(
            f"Attrition target must contain both classes 0 and 1. "
            f"Observed class counts: {counts.to_dict()}"
        )

    if int(counts.min()) < 4:
        raise ValueError(
            "Too few examples exist in one attrition class to train a reliable model. "
            f"Class counts: {counts.to_dict()}"
        )

    return y


# =============================================================================
# FEATURE CLEANING
# =============================================================================

def _drop_non_predictive_columns(
    df: pd.DataFrame,
    target_col: str,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Remove:
    - identifier-like unique columns,
    - constant columns,
    - direct protected attributes.
    """
    drop_cols: List[str] = []

    for col in df.columns:
        if col == target_col:
            continue

        clean = _normalize_name(col)
        nunique = int(df[col].nunique(dropna=True))
        unique_ratio = nunique / max(len(df), 1)

        # Constant columns add no predictive information.
        if nunique <= 1:
            drop_cols.append(col)
            continue

        # Protected attributes are excluded from the ML prediction itself.
        if clean in {_normalize_name(x) for x in SENSITIVE_FEATURE_KEYS}:
            drop_cols.append(col)
            continue

        # Only drop ID-like columns when they are mostly unique.
        id_like = (
            clean in {
                "id",
                "employeeid",
                "employeenumber",
                "employeeno",
                "empid",
                "empno",
                "recordid",
            }
            or clean.endswith("id")
        )

        if id_like and unique_ratio >= 0.80:
            drop_cols.append(col)

    if drop_cols:
        df = df.drop(columns=sorted(set(drop_cols)), errors="ignore")

    return df, sorted(set(drop_cols))


def _training_numeric_ranges(
    X_train: pd.DataFrame,
    num_cols: List[str],
) -> Dict[str, Dict[str, float]]:
    ranges: Dict[str, Dict[str, float]] = {}

    for col in num_cols:
        values = pd.to_numeric(X_train[col], errors="coerce").dropna()
        if values.empty:
            continue

        ranges[col] = {
            "min": float(values.min()),
            "max": float(values.max()),
            "median": float(values.median()),
        }

    return ranges


# =============================================================================
# FEATURE IMPORTANCE
# =============================================================================

def _aggregate_feature_importance(
    fitted_model: Any,
    encoded_feature_names: List[str],
    num_cols: List[str],
    cat_cols: List[str],
) -> List[Dict[str, Any]]:
    if hasattr(fitted_model, "feature_importances_"):
        importances = np.asarray(fitted_model.feature_importances_, dtype=float)
    elif hasattr(fitted_model, "coef_"):
        importances = np.abs(np.asarray(fitted_model.coef_[0], dtype=float))
    else:
        importances = np.zeros(len(encoded_feature_names), dtype=float)

    feature_scores: Dict[str, float] = {}

    for encoded_name, importance in zip(encoded_feature_names, importances):
        original_name = encoded_name

        if encoded_name in num_cols:
            original_name = encoded_name
        else:
            # OneHotEncoder output is normally "<column>_<category>".
            for col in cat_cols:
                prefix = f"{col}_"
                if encoded_name == col or encoded_name.startswith(prefix):
                    original_name = col
                    break

        feature_scores[original_name] = (
            feature_scores.get(original_name, 0.0) + float(importance)
        )

    total = sum(feature_scores.values()) or 1.0

    return sorted(
        [
            {
                "feature": feature,
                "importance": round(score / total, 4),
            }
            for feature, score in feature_scores.items()
        ],
        key=lambda item: item["importance"],
        reverse=True,
    )


# =============================================================================
# TRAINING
# =============================================================================

def preprocess_and_train_models(
    df: pd.DataFrame,
    target_col: str,
    column_mapping: Dict[str, str],
    model_save_dir: str,
) -> Dict[str, Any]:
    """
    Training pipeline.

    Main correctness changes:
    - validates target labels instead of silently mapping unknown labels to 0,
    - removes constant / ID / protected fields,
    - evaluates candidates with stratified cross-validation,
    - uses calibrated probabilities,
    - does not use class_weight='balanced' in Logistic Regression simply to
      manufacture 50/50-looking probabilities,
    - saves training ranges/reference values for safe single predictions.
    """
    df = df.copy()

    if column_mapping:
        df = df.rename(columns=column_mapping)

    actual_target = column_mapping.get(target_col, target_col)

    if actual_target not in df.columns:
        raise ValueError(
            f"Target column '{actual_target}' not found. "
            f"Available columns: {list(df.columns)}"
        )

    y_raw = df[actual_target].dropna()
    y = _encode_target(y_raw)

    df_model = df.loc[y.index].copy()
    df_model, dropped_columns = _drop_non_predictive_columns(
        df_model,
        actual_target,
    )

    X = df_model.drop(columns=[actual_target], errors="ignore")

    if X.empty or X.shape[1] == 0:
        raise ValueError("No usable feature columns remain after data cleaning.")

    num_cols = X.select_dtypes(
        include=["number"]
    ).columns.tolist()

    cat_cols = X.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    unsupported = [
        col for col in X.columns
        if col not in num_cols and col not in cat_cols
    ]

    if unsupported:
        # Convert unusual dtypes to categorical strings rather than dropping silently.
        X = X.copy()
        for col in unsupported:
            X[col] = X[col].astype(str)
            cat_cols.append(col)

    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    preprocessor_template = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, num_cols),
            ("cat", cat_pipeline, cat_cols),
        ],
        remainder="drop",
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    candidate_models = {
        # No class_weight here because the app displays the output as a probability.
        # class_weight='balanced' can heavily distort probability calibration.
        "Logistic Regression": LogisticRegression(
            max_iter=2500,
            C=1.0,
            class_weight=None,
            solver="lbfgs",
            random_state=42,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=350,
            max_depth=12,
            min_samples_leaf=3,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=180,
            learning_rate=0.05,
            max_depth=2,
            min_samples_leaf=5,
            random_state=42,
        ),
    }

    class_counts = y_train.value_counts()
    smallest_train_class = int(class_counts.min())
    cv_splits = max(2, min(5, smallest_train_class))

    cv = StratifiedKFold(
        n_splits=cv_splits,
        shuffle=True,
        random_state=42,
    )

    results: List[Dict[str, Any]] = []
    trained_artifacts: Dict[str, Dict[str, Any]] = {}

    best_model_name = ""
    best_score = -1.0

    os.makedirs(model_save_dir, exist_ok=True)

    for name, base_model in candidate_models.items():
        # ---------------------------------------------------------------------
        # 1. Cross-validation on RAW training data.
        # Preprocessing happens inside each fold, avoiding preprocessing leakage.
        # ---------------------------------------------------------------------
        cv_pipeline = Pipeline(
            steps=[
                ("preprocessor", clone(preprocessor_template)),
                ("model", clone(base_model)),
            ]
        )

        cv_auc_scores = cross_val_score(
            cv_pipeline,
            X_train,
            y_train,
            cv=cv,
            scoring="roc_auc",
            n_jobs=None,
        )

        cv_f1_scores = cross_val_score(
            cv_pipeline,
            X_train,
            y_train,
            cv=cv,
            scoring="f1",
            n_jobs=None,
        )

        cv_auc = float(np.mean(cv_auc_scores))
        cv_f1 = float(np.mean(cv_f1_scores))

        # ---------------------------------------------------------------------
        # 2. Fit preprocessing on the full training split.
        # ---------------------------------------------------------------------
        preprocessor = clone(preprocessor_template)

        X_train_trans = preprocessor.fit_transform(X_train)
        X_test_trans = preprocessor.transform(X_test)

        encoded_feature_names = list(num_cols)

        if cat_cols:
            encoder = (
                preprocessor
                .named_transformers_["cat"]
                .named_steps["encoder"]
            )
            encoded_feature_names.extend(
                encoder.get_feature_names_out(cat_cols).tolist()
            )

        # ---------------------------------------------------------------------
        # 3. Fit one plain model for feature explanation.
        # ---------------------------------------------------------------------
        explain_model = clone(base_model)
        explain_model.fit(X_train_trans, y_train)

        # ---------------------------------------------------------------------
        # 4. Fit a calibrated model for the probability shown to the user.
        # ---------------------------------------------------------------------
        calibration_splits = max(
            2,
            min(5, int(y_train.value_counts().min())),
        )

        calibrated_model = CalibratedClassifierCV(
            estimator=clone(base_model),
            method="sigmoid",
            cv=calibration_splits,
        )

        calibrated_model.fit(
            X_train_trans,
            y_train,
        )

        y_prob = _get_model_probability(
            calibrated_model,
            X_test_trans,
        )

        y_pred = (
            y_prob >= 0.50
        ).astype(int)

        accuracy = float(
            accuracy_score(
                y_test,
                y_pred,
            )
        )

        precision = float(
            precision_score(
                y_test,
                y_pred,
                zero_division=0,
            )
        )

        recall = float(
            recall_score(
                y_test,
                y_pred,
                zero_division=0,
            )
        )

        f1 = float(
            f1_score(
                y_test,
                y_pred,
                zero_division=0,
            )
        )

        auc = float(
            roc_auc_score(
                y_test,
                y_prob,
            )
        )

        cm = confusion_matrix(
            y_test,
            y_pred,
        ).tolist()

        feature_importances = _aggregate_feature_importance(
            fitted_model=explain_model,
            encoded_feature_names=encoded_feature_names,
            num_cols=num_cols,
            cat_cols=cat_cols,
        )

        numeric_ranges = _training_numeric_ranges(
            X_train,
            num_cols,
        )

        # Model selection is based primarily on cross-validated discrimination,
        # not a single lucky/unlucky holdout split.
        composite_score = (
            0.65 * cv_auc
            + 0.35 * cv_f1
        )

        model_filename = (
            "model_"
            + name.lower().replace(" ", "_")
            + ".joblib"
        )

        model_path = os.path.join(
            model_save_dir,
            model_filename,
        )

        artifact = {
            "model": calibrated_model,
            "explain_model": explain_model,
            "preprocessor": preprocessor,
            "num_cols": num_cols,
            "cat_cols": cat_cols,
            "encoded_feature_names": encoded_feature_names,
            "target_col": actual_target,
            "numeric_ranges": numeric_ranges,
            "dropped_columns": dropped_columns,
            "training_prevalence": float(y_train.mean()),
            "model_name": name,
        }

        joblib.dump(
            artifact,
            model_path,
        )

        model_result = {
            "model_name": name,
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "cv_roc_auc": round(cv_auc, 4),
            "cv_f1_score": round(cv_f1, 4),
            "confusion_matrix": cm,
            "feature_importances": feature_importances[:10],
            "model_path": model_path,
            "training_prevalence": round(float(y_train.mean()), 4),
        }

        results.append(model_result)
        trained_artifacts[name] = artifact

        if composite_score > best_score:
            best_score = composite_score
            best_model_name = name

    for result in results:
        result["is_best"] = (
            result["model_name"] == best_model_name
        )

    best_result = next(
        result
        for result in results
        if result["is_best"]
    )

    best_model_path = best_result["model_path"]

    best_cv_auc = float(
        best_result["cv_roc_auc"]
    )

    quality_warning = None

    if best_cv_auc < 0.60:
        quality_warning = (
            "The best model has weak cross-validated ROC-AUC "
            f"({best_cv_auc:.3f}). The dataset may contain limited predictive "
            "signal, so individual probabilities and what-if changes should be "
            "treated as low-confidence model estimates."
        )

    return {
        "best_model_name": best_model_name,
        "best_model_path": best_model_path,
        "all_results": results,
        "best_metrics": best_result,
        "model_quality_warning": quality_warning,
        "dropped_columns": dropped_columns,
    }


# =============================================================================
# SAFE INPUT CONSTRUCTION FOR SINGLE PREDICTIONS
# =============================================================================

def _reference_values_from_preprocessor(
    preprocessor: ColumnTransformer,
    num_cols: List[str],
    cat_cols: List[str],
) -> Dict[str, Any]:
    references: Dict[str, Any] = {}

    if num_cols:
        num_transformer = preprocessor.named_transformers_.get("num")
        if num_transformer is not None:
            imputer = num_transformer.named_steps.get("imputer")
            if imputer is not None and hasattr(imputer, "statistics_"):
                for col, stat in zip(num_cols, imputer.statistics_):
                    if pd.notna(stat):
                        references[col] = float(stat)

    if cat_cols:
        cat_transformer = preprocessor.named_transformers_.get("cat")
        if cat_transformer is not None:
            imputer = cat_transformer.named_steps.get("imputer")
            if imputer is not None and hasattr(imputer, "statistics_"):
                for col, stat in zip(cat_cols, imputer.statistics_):
                    if pd.notna(stat):
                        references[col] = str(stat)

    return references


def _construct_safe_model_row(
    employee_input: Dict[str, Any],
    preprocessor: ColumnTransformer,
    num_cols: List[str],
    cat_cols: List[str],
    numeric_ranges: Optional[Dict[str, Dict[str, float]]] = None,
) -> Dict[str, Any]:
    """
    Build a complete prediction row without silently turning missing fields into 0.

    Missing values fall back to the fitted training median/mode.
    Numeric what-if values are clipped to the observed training range to avoid
    extreme out-of-distribution extrapolation.
    """
    references = _reference_values_from_preprocessor(
        preprocessor,
        num_cols,
        cat_cols,
    )

    numeric_ranges = numeric_ranges or {}

    row: Dict[str, Any] = {}

    for col in num_cols:
        actual_key = _find_existing_key(
            employee_input,
            col,
        )

        fallback = float(
            references.get(
                col,
                0.0,
            )
        )

        raw_value = (
            employee_input.get(actual_key)
            if actual_key is not None
            else fallback
        )

        value = _safe_float(
            raw_value,
            fallback,
        )

        limits = numeric_ranges.get(col)

        if limits:
            minimum = float(limits["min"])
            maximum = float(limits["max"])
            value = float(
                np.clip(
                    value,
                    minimum,
                    maximum,
                )
            )

        row[col] = value

    for col in cat_cols:
        actual_key = _find_existing_key(
            employee_input,
            col,
        )

        fallback = str(
            references.get(
                col,
                "Unknown",
            )
        )

        raw_value = (
            employee_input.get(actual_key)
            if actual_key is not None
            else fallback
        )

        if raw_value is None or str(raw_value).strip() == "":
            raw_value = fallback

        row[col] = str(raw_value)

    return row


# =============================================================================
# LOCAL MODEL EXPLANATION
# =============================================================================

def calculate_local_probability_factors(
    row_dict: Dict[str, Any],
    model: Any,
    preprocessor: Any,
    num_cols: List[str],
    cat_cols: List[str],
    original_probability: float,
    top_n: int = 6,
) -> List[Dict[str, Any]]:
    """
    Model-agnostic local sensitivity.

    Each eligible work-related feature is replaced by the fitted training
    reference value (median or most frequent category), one at a time.

    Positive probability_point_impact:
        this employee's current value pushes model probability UP vs reference.

    Negative probability_point_impact:
        this employee's current value pushes model probability DOWN vs reference.
    """
    if not hasattr(model, "predict_proba"):
        return []

    reference_values = _reference_values_from_preprocessor(
        preprocessor,
        num_cols,
        cat_cols,
    )

    factors: List[Dict[str, Any]] = []

    for col in list(num_cols) + list(cat_cols):
        normalized = _normalize_name(col)

        if normalized not in EXPLAINABLE_WORK_FEATURES:
            continue

        if col not in reference_values:
            continue

        current_value = row_dict.get(col)
        reference_value = reference_values[col]

        if str(current_value) == str(reference_value):
            continue

        changed_row = dict(row_dict)
        changed_row[col] = reference_value

        changed_df = pd.DataFrame(
            [changed_row]
        )

        changed_transformed = preprocessor.transform(
            changed_df
        )

        reference_probability = float(
            _get_model_probability(
                model,
                changed_transformed,
            )[0]
        )

        delta = (
            float(original_probability)
            - reference_probability
        )

        factors.append(
            {
                "feature": col,
                "input_value": _native_value(current_value),
                "reference_value": _native_value(reference_value),
                "reference_probability": round(reference_probability, 4),
                "probability_point_impact": round(delta * 100, 2),
                "direction": (
                    "higher"
                    if delta > 0
                    else "lower"
                    if delta < 0
                    else "neutral"
                ),
                "magnitude": round(abs(delta) * 100, 2),
            }
        )

    factors.sort(
        key=lambda item: item["magnitude"],
        reverse=True,
    )

    return factors[:top_n]


def _model_aligned_risk_factors(
    local_factors: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Convert only model-supported positive local effects into UI risk factors.
    This prevents hard-coded rules from contradicting the actual model.
    """
    output: List[Dict[str, Any]] = []

    for item in local_factors:
        impact = float(
            item.get(
                "probability_point_impact",
                0.0,
            )
        )

        # Only call something a risk factor when the model says this current
        # value raises risk versus its fitted training reference.
        if impact <= 0.05:
            continue

        magnitude = abs(impact)

        if magnitude >= 5:
            severity = "High"
        elif magnitude >= 2:
            severity = "Medium"
        else:
            severity = "Low"

        output.append(
            {
                "factor": item["feature"],
                "impact": severity,
                "description": (
                    f"Current value {item.get('input_value')} raises the model-estimated "
                    f"attrition probability by about {impact:.2f} percentage points "
                    f"relative to the training reference value "
                    f"{item.get('reference_value')}."
                ),
                "probability_point_impact": round(impact, 2),
                "reference_value": item.get("reference_value"),
            }
        )

    if not output:
        output.append(
            {
                "factor": "No strong local risk-increasing workplace factor",
                "impact": "Low",
                "description": (
                    "Among the tested work-related features, none increased the "
                    "model probability strongly relative to its training reference."
                ),
            }
        )

    return output[:4]


# =============================================================================
# MODEL-ALIGNED RECOMMENDATIONS
# =============================================================================

def generate_retention_recommendations(
    row: dict,
    prob: float,
    risk_factors: list,
) -> List[Dict[str, Any]]:
    """
    Generate non-sensitive HR review actions only from model-supported factors.

    These are support actions, not employment decisions.
    """
    if prob >= 0.65:
        priority = "URGENT"
    elif prob >= 0.35:
        priority = "HIGH"
    else:
        priority = "STANDARD"

    recs: List[Dict[str, Any]] = []
    seen = set()

    for factor in risk_factors:
        feature = _normalize_name(
            factor.get(
                "factor",
                "",
            )
        )

        recommendation = None

        if feature == "overtime":
            recommendation = {
                "priority": priority,
                "title": "Review Workload & Overtime",
                "action": (
                    "Check whether workload, staffing, scheduling, or repeated "
                    "overtime can be improved."
                ),
            }

        elif feature == "jobsatisfaction":
            recommendation = {
                "priority": priority,
                "title": "Employee Experience Check-In",
                "action": (
                    "Use a voluntary manager/HR check-in to understand role "
                    "satisfaction, blockers, recognition, and support needs."
                ),
            }

        elif feature == "worklifebalance":
            recommendation = {
                "priority": priority,
                "title": "Work-Life Balance Review",
                "action": (
                    "Review scheduling flexibility, workload distribution, and "
                    "time-off practices with the employee."
                ),
            }

        elif feature == "monthlyincome":
            recommendation = {
                "priority": priority,
                "title": "Compensation Fairness Review",
                "action": (
                    "Review compensation using the organization's normal pay-equity "
                    "and market-benchmark process."
                ),
            }

        elif feature == "distancefromhome":
            recommendation = {
                "priority": "STANDARD",
                "title": "Work Arrangement Review",
                "action": (
                    "Where role policy allows, discuss flexible scheduling or "
                    "hybrid-work options."
                ),
            }

        elif feature in {
            "yearssincelastpromotion",
            "yearsincurrentrole",
            "yearsatcompany",
            "joblevel",
        }:
            recommendation = {
                "priority": "STANDARD",
                "title": "Career Development Review",
                "action": (
                    "Discuss role growth, development goals, internal opportunities, "
                    "and training options."
                ),
            }

        elif feature in {
            "environmentsatisfaction",
            "jobinvolvement",
        }:
            recommendation = {
                "priority": priority,
                "title": "Work Environment Check-In",
                "action": (
                    "Ask about workplace support, role clarity, team environment, "
                    "and engagement barriers."
                ),
            }

        if recommendation and recommendation["title"] not in seen:
            recs.append(recommendation)
            seen.add(recommendation["title"])

    if not recs:
        recs.append(
            {
                "priority": "STANDARD",
                "title": "No Automatic Intervention",
                "action": (
                    "Use the model only as decision-support. Do not take an employment "
                    "action solely from this score; validate concerns through normal HR "
                    "processes and employee conversations."
                ),
            }
        )

    return recs[:5]


# Backward-compatible function name. It now returns model-aligned factors when
# local explanation data is supplied by batch/single prediction code.
def extract_individual_risk_factors(
    row: dict,
    prob: float,
) -> List[Dict[str, Any]]:
    """
    Retained for compatibility with older imports.

    This function intentionally avoids inventing causal explanations.
    Actual model-aligned risk factors are generated in batch_predict() and
    predict_single_employee() from local probability sensitivities.
    """
    return [
        {
            "factor": "Model probability",
            "impact": _risk_level(prob),
            "description": (
                "Use the local_explanations field for the actual employee-specific "
                "model factors."
            ),
        }
    ]


# =============================================================================
# BATCH PREDICTION
# =============================================================================

def batch_predict(
    df: pd.DataFrame,
    model_path: str,
    column_mapping: Dict[str, str] = None,
) -> List[Dict[str, Any]]:
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}"
        )

    artifact = joblib.load(model_path)

    model = artifact["model"]
    preprocessor = artifact["preprocessor"]
    num_cols = artifact["num_cols"]
    cat_cols = artifact["cat_cols"]
    target_col = artifact["target_col"]
    numeric_ranges = artifact.get(
        "numeric_ranges",
        {},
    )

    df_clean = df.copy()

    if column_mapping:
        df_clean = df_clean.rename(
            columns=column_mapping
        )

    X_raw = (
        df_clean.drop(
            columns=[target_col],
            errors="ignore",
        )
    )

    model_rows = []

    for _, row in X_raw.iterrows():
        row_dict = _construct_safe_model_row(
            employee_input=row.to_dict(),
            preprocessor=preprocessor,
            num_cols=num_cols,
            cat_cols=cat_cols,
            numeric_ranges=numeric_ranges,
        )
        model_rows.append(row_dict)

    X_model = pd.DataFrame(
        model_rows,
        columns=num_cols + cat_cols,
    )

    X_trans = preprocessor.transform(
        X_model
    )

    probabilities = _get_model_probability(
        model,
        X_trans,
    )

    predictions: List[Dict[str, Any]] = []

    for position, prob in enumerate(probabilities):
        full_row = df_clean.iloc[position].to_dict()
        model_row = model_rows[position]

        prob_float = float(prob)
        risk_level = _risk_level(
            prob_float
        )

        local_factors = calculate_local_probability_factors(
            row_dict=model_row,
            model=model,
            preprocessor=preprocessor,
            num_cols=num_cols,
            cat_cols=cat_cols,
            original_probability=prob_float,
            top_n=6,
        )

        risk_factors = _model_aligned_risk_factors(
            local_factors
        )

        recommendations = generate_retention_recommendations(
            row=model_row,
            prob=prob_float,
            risk_factors=risk_factors,
        )

        employee_id = str(
            full_row.get(
                "EmployeeNumber",
                full_row.get(
                    "EmployeeID",
                    full_row.get(
                        "id",
                        position + 1001,
                    ),
                ),
            )
        )

        department = str(
            full_row.get(
                "Department",
                full_row.get(
                    "Dept",
                    "General",
                ),
            )
        )

        job_role = str(
            full_row.get(
                "JobRole",
                full_row.get(
                    "Job Role",
                    full_row.get(
                        "Role",
                        "Employee",
                    ),
                ),
            )
        )

        predictions.append(
            {
                "employee_id": employee_id,
                "department": department,
                "job_role": job_role,
                "monthly_income": _safe_float(
                    full_row.get(
                        "MonthlyIncome",
                        full_row.get(
                            "Monthly Income",
                            full_row.get(
                                "Salary",
                                0,
                            ),
                        ),
                    ),
                    0,
                ),
                "job_satisfaction": _safe_int(
                    full_row.get(
                        "JobSatisfaction",
                        full_row.get(
                            "Job Satisfaction",
                            3,
                        ),
                    ),
                    3,
                ),
                "overtime": str(
                    full_row.get(
                        "OverTime",
                        full_row.get(
                            "Overtime",
                            "No",
                        ),
                    )
                ),
                "work_life_balance": _safe_int(
                    full_row.get(
                        "WorkLifeBalance",
                        full_row.get(
                            "Work Life Balance",
                            3,
                        ),
                    ),
                    3,
                ),
                "years_at_company": _safe_int(
                    full_row.get(
                        "YearsAtCompany",
                        full_row.get(
                            "Years At Company",
                            0,
                        ),
                    ),
                    0,
                ),
                "distance_from_home": _safe_int(
                    full_row.get(
                        "DistanceFromHome",
                        full_row.get(
                            "Distance From Home",
                            0,
                        ),
                    ),
                    0,
                ),
                "probability": round(
                    prob_float,
                    4,
                ),
                "risk_level": risk_level,
                "top_risk_factors": risk_factors,
                "recommendations": recommendations,
                "local_explanations": local_factors,
                "raw_data": {
                    key: _native_value(value)
                    for key, value in full_row.items()
                },
            }
        )

    return predictions


# =============================================================================
# SINGLE EMPLOYEE PREDICTION
# =============================================================================

def predict_single_employee(
    employee_input: dict,
    model_path: str,
    column_mapping: dict = None,
) -> dict:
    """
    Predict one employee using the exact saved company model.

    Correctness protections:
    - normalized key matching,
    - missing values use fitted training median/mode,
    - numeric scenario values are clipped to the training range,
    - local explanations come from actual model probability changes.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}"
        )

    artifact = joblib.load(
        model_path
    )

    model = artifact["model"]
    explain_model = artifact.get(
        "explain_model",
        model,
    )
    preprocessor = artifact["preprocessor"]
    num_cols = artifact["num_cols"]
    cat_cols = artifact["cat_cols"]
    numeric_ranges = artifact.get(
        "numeric_ranges",
        {},
    )

    input_data = dict(
        employee_input or {}
    )

    if column_mapping:
        # Accept callers that still send original names.
        for original, mapped in column_mapping.items():
            if original in input_data and mapped not in input_data:
                input_data[mapped] = input_data[original]

    row_dict = _construct_safe_model_row(
        employee_input=input_data,
        preprocessor=preprocessor,
        num_cols=num_cols,
        cat_cols=cat_cols,
        numeric_ranges=numeric_ranges,
    )

    df_single = pd.DataFrame(
        [row_dict],
        columns=num_cols + cat_cols,
    )

    X_trans = preprocessor.transform(
        df_single
    )

    prob = float(
        _get_model_probability(
            model,
            X_trans,
        )[0]
    )

    risk_level = _risk_level(
        prob
    )

    local_explanations = calculate_local_probability_factors(
        row_dict=row_dict,
        model=model,
        preprocessor=preprocessor,
        num_cols=num_cols,
        cat_cols=cat_cols,
        original_probability=prob,
        top_n=6,
    )

    risk_factors = _model_aligned_risk_factors(
        local_explanations
    )

    recommendations = generate_retention_recommendations(
        row=row_dict,
        prob=prob,
        risk_factors=risk_factors,
    )

    encoded_names = artifact.get(
        "encoded_feature_names",
        [],
    )

    feature_contributions: List[Dict[str, Any]] = []

    if hasattr(explain_model, "feature_importances_"):
        importances = np.asarray(
            explain_model.feature_importances_,
            dtype=float,
        )
    elif hasattr(explain_model, "coef_"):
        importances = np.abs(
            np.asarray(
                explain_model.coef_[0],
                dtype=float,
            )
        )
    else:
        importances = np.zeros(
            len(encoded_names),
            dtype=float,
        )

    for name, importance in zip(
        encoded_names,
        importances,
    ):
        feature_contributions.append(
            {
                "feature": str(name),
                "contribution": round(
                    float(importance) * 100,
                    2,
                ),
            }
        )

    feature_contributions = sorted(
        feature_contributions,
        key=lambda item: item["contribution"],
        reverse=True,
    )[:8]

    def display_value(*aliases, default=None):
        for alias in aliases:
            key = _find_existing_key(
                input_data,
                alias,
            )
            if key is not None:
                return input_data[key]
        return default

    return {
        "employee_id": str(
            display_value(
                "EmployeeNumber",
                "EmployeeID",
                default="CUSTOM",
            )
        ),
        "department": str(
            display_value(
                "Department",
                default="General",
            )
        ),
        "job_role": str(
            display_value(
                "JobRole",
                "Job Role",
                "Role",
                default="Employee",
            )
        ),
        "monthly_income": _safe_float(
            display_value(
                "MonthlyIncome",
                "Monthly Income",
                "Salary",
                default=0,
            ),
            0,
        ),
        "job_satisfaction": _safe_int(
            display_value(
                "JobSatisfaction",
                "Job Satisfaction",
                default=3,
            ),
            3,
        ),
        "overtime": str(
            display_value(
                "OverTime",
                "Overtime",
                default="No",
            )
        ),
        "work_life_balance": _safe_int(
            display_value(
                "WorkLifeBalance",
                "Work Life Balance",
                default=3,
            ),
            3,
        ),
        "years_at_company": _safe_int(
            display_value(
                "YearsAtCompany",
                "Years At Company",
                default=0,
            ),
            0,
        ),
        "distance_from_home": _safe_int(
            display_value(
                "DistanceFromHome",
                "Distance From Home",
                default=0,
            ),
            0,
        ),
        "probability": round(
            prob,
            4,
        ),
        "risk_level": risk_level,
        "top_risk_factors": risk_factors,
        "recommendations": recommendations,
        "feature_contributions": feature_contributions,
        "probability_available": True,
        "local_explanations": local_explanations,
        "explanation_method": (
            "Local one-feature-at-a-time probability sensitivity against "
            "fitted training reference values using the calibrated active model"
        ),
        "explanation_disclaimer": (
            "These are model sensitivities, not guaranteed causes of employee attrition."
        ),
        "input_safety": {
            "missing_values_use_training_reference": True,
            "numeric_values_clipped_to_training_range": True,
        },
    }


# =============================================================================
# PIPELINE INFO
# =============================================================================

def get_pipeline_implementation_details() -> Dict[str, Any]:
    return {
        "preprocessing": [
            "Numerical missing values: median imputation",
            "Numerical scaling: StandardScaler",
            "Categorical missing values: most-frequent imputation",
            "Categorical encoding: OneHotEncoder(handle_unknown='ignore')",
            "Identifier-like, constant, and direct protected-attribute columns are removed from model training",
        ],
        "data_split": (
            "80/20 stratified train-test holdout with random_state=42"
        ),
        "cross_validation": {
            "implemented": True,
            "details": (
                "Stratified cross-validation on the training split is used for model selection. "
                "Preprocessing is fitted inside each CV fold."
            ),
        },
        "probability_calibration": {
            "implemented": True,
            "details": (
                "Candidate models are wrapped with CalibratedClassifierCV(method='sigmoid') "
                "before user-facing probabilities are produced."
            ),
        },
        "balancing": {
            "implemented": True,
            "details": (
                "Random Forest uses balanced_subsample. Logistic Regression does not use "
                "class_weight='balanced' because the UI displays its output as a probability; "
                "probability calibration is applied instead."
            ),
        },
        "feature_selection": {
            "implemented": False,
            "details": (
                "No separate automated feature-selection algorithm is used. "
                "Identifier-like, constant, and direct protected-attribute columns are removed."
            ),
        },
        "model_comparison": (
            "Logistic Regression, Random Forest, and Gradient Boosting"
        ),
        "model_selection": (
            "Best model selected primarily from cross-validated ROC-AUC and F1 score "
            "(65% ROC-AUC, 35% F1)."
        ),
        "hyperparameter_tuning": {
            "implemented": False,
            "details": (
                "No GridSearchCV/RandomizedSearchCV is currently used."
            ),
        },
        "oversampling": {
            "implemented": False,
            "details": (
                "No SMOTE or synthetic oversampling is used."
            ),
        },
        "single_prediction_safety": [
            "Missing model inputs use fitted training median/mode rather than 0/'Unknown'",
            "Numeric what-if values are clipped to observed training min/max",
            "Local risk factors come from actual model probability sensitivity rather than hard-coded rules",
        ],
    }
