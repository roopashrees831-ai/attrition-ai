import os

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.schema import (
    User,
    Dataset,
    TrainedModel,
    EmployeePrediction
)

from app.security import get_current_user

from app.schemas.pydantic_models import (
    ModelTrainRequest
)

from app.services.ml_engine import (
    preprocess_and_train_models,
    batch_predict,
    get_pipeline_implementation_details
)

from app.config import settings


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/models",
    tags=["Models"]
)


# ============================================================
# TRAIN MODEL
# ============================================================

@router.post("/train")
def train_model(
    req: ModelTrainRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    )
):

    # ========================================================
    # 1. FIND DATASET FOR CURRENT COMPANY
    # ========================================================

    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == req.dataset_id,
            Dataset.company_id ==
            current_user.company_id
        )
        .first()
    )


    if not dataset:

        raise HTTPException(
            status_code=404,
            detail="Dataset not found."
        )


    # ========================================================
    # 2. CHECK DATASET FILE
    # ========================================================

    if not os.path.exists(
        dataset.filepath
    ):

        raise HTTPException(
            status_code=404,
            detail=(
                f"Dataset file at "
                f"{dataset.filepath} "
                f"is missing."
            )
        )


    # ========================================================
    # 3. LOAD CSV
    # ========================================================

    try:

        df = pd.read_csv(
            dataset.filepath
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                "Failed to read dataset: "
                f"{str(exc)}"
            )
        )


    # ========================================================
    # 4. BASIC DATASET CHECKS
    # ========================================================

    if df.empty:

        raise HTTPException(
            status_code=400,
            detail=(
                "The selected dataset is empty."
            )
        )


    if len(df) < 20:

        raise HTTPException(
            status_code=400,
            detail=(
                "The selected dataset does not "
                "contain enough employee records "
                "for model training."
            )
        )


    # ========================================================
    # 5. COMPANY MODEL DIRECTORY
    # ========================================================

    company_model_dir = os.path.join(
        settings.MODEL_DIR,
        f"company_{current_user.company_id}"
    )


    os.makedirs(
        company_model_dir,
        exist_ok=True
    )


    # ========================================================
    # 6. TRAIN ALL MODELS
    # ========================================================

    try:

        train_results = (
            preprocess_and_train_models(
                df=df,

                target_col=(
                    dataset.target_col
                    or "Attrition"
                ),

                column_mapping=(
                    dataset.column_mapping
                    or {}
                ),

                model_save_dir=(
                    company_model_dir
                )
            )
        )

    except ValueError as exc:

        # Validation/data problems should
        # be shown as a useful 400 error.

        raise HTTPException(
            status_code=400,
            detail=(
                "Model training could not "
                "continue: "
                f"{str(exc)}"
            )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Model training failed: "
                f"{str(exc)}"
            )
        )


    # ========================================================
    # 7. CHECK TRAINING RESULT
    # ========================================================

    all_results = (
        train_results.get(
            "all_results",
            []
        )
    )


    if not all_results:

        raise HTTPException(
            status_code=500,
            detail=(
                "Training completed without "
                "returning model results."
            )
        )


    best_model_path = (
        train_results.get(
            "best_model_path"
        )
    )


    if (
        not best_model_path
        or not os.path.exists(
            best_model_path
        )
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Best trained model file "
                "was not created correctly."
            )
        )


    # ========================================================
    # 8. RUN BATCH PREDICTIONS FIRST
    #
    # IMPORTANT:
    # Do this BEFORE deleting old database records.
    #
    # If prediction fails, the previous working
    # database results remain available.
    # ========================================================

    try:

        predictions = batch_predict(
            df=df,

            model_path=(
                best_model_path
            ),

            column_mapping=(
                dataset.column_mapping
                or {}
            )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Models were trained, but "
                "employee prediction generation "
                "failed: "
                f"{str(exc)}"
            )
        )


    # ========================================================
    # 9. REPLACE OLD COMPANY MODEL DATA
    # ========================================================

    try:

        # ----------------------------------------------------
        # REMOVE PREVIOUS MODEL RECORDS
        # ----------------------------------------------------

        (
            db.query(TrainedModel)
            .filter(
                TrainedModel.company_id ==
                current_user.company_id
            )
            .delete(
                synchronize_session=False
            )
        )


        # ----------------------------------------------------
        # REMOVE PREVIOUS EMPLOYEE PREDICTIONS
        # ----------------------------------------------------

        (
            db.query(EmployeePrediction)
            .filter(
                EmployeePrediction.company_id ==
                current_user.company_id
            )
            .delete(
                synchronize_session=False
            )
        )


        # ====================================================
        # 10. STORE NEW TRAINED MODEL RESULTS
        # ====================================================

        for result in all_results:

            # FIX:
            # Each model stores its own actual file.
            #
            # Old code stored best_model_path
            # for every model.

            model_filepath = (
                result.get(
                    "model_path"
                )
                or best_model_path
            )


            trained_model = TrainedModel(

                company_id=(
                    current_user.company_id
                ),

                dataset_id=(
                    dataset.id
                ),

                model_name=(
                    result["model_name"]
                ),

                is_best=(
                    bool(
                        result.get(
                            "is_best",
                            False
                        )
                    )
                ),

                accuracy=(
                    float(
                        result.get(
                            "accuracy",
                            0
                        )
                    )
                ),

                precision=(
                    float(
                        result.get(
                            "precision",
                            0
                        )
                    )
                ),

                recall=(
                    float(
                        result.get(
                            "recall",
                            0
                        )
                    )
                ),

                f1_score=(
                    float(
                        result.get(
                            "f1_score",
                            0
                        )
                    )
                ),

                roc_auc=(
                    float(
                        result.get(
                            "roc_auc",
                            0
                        )
                    )
                ),

                metrics_json={

                    "confusion_matrix":
                        result.get(
                            "confusion_matrix",
                            [
                                [0, 0],
                                [0, 0]
                            ]
                        ),

                    # Holdout metrics
                    "accuracy":
                        result.get(
                            "accuracy"
                        ),

                    "precision":
                        result.get(
                            "precision"
                        ),

                    "recall":
                        result.get(
                            "recall"
                        ),

                    "f1_score":
                        result.get(
                            "f1_score"
                        ),

                    "roc_auc":
                        result.get(
                            "roc_auc"
                        ),

                    # New CV metrics from
                    # corrected ml_engine.py
                    "cv_roc_auc":
                        result.get(
                            "cv_roc_auc"
                        ),

                    "cv_f1_score":
                        result.get(
                            "cv_f1_score"
                        ),

                    "training_prevalence":
                        result.get(
                            "training_prevalence"
                        ),

                    # Complete comparison
                    "all_results": [
                        {
                            "model_name":
                                item.get(
                                    "model_name"
                                ),

                            "is_best":
                                item.get(
                                    "is_best",
                                    False
                                ),

                            "accuracy":
                                item.get(
                                    "accuracy"
                                ),

                            "precision":
                                item.get(
                                    "precision"
                                ),

                            "recall":
                                item.get(
                                    "recall"
                                ),

                            "f1_score":
                                item.get(
                                    "f1_score"
                                ),

                            "roc_auc":
                                item.get(
                                    "roc_auc"
                                ),

                            "cv_roc_auc":
                                item.get(
                                    "cv_roc_auc"
                                ),

                            "cv_f1_score":
                                item.get(
                                    "cv_f1_score"
                                )
                        }

                        for item
                        in all_results
                    ]
                },

                feature_importance_json=(
                    result.get(
                        "feature_importances",
                        []
                    )
                ),

                trained_filepath=(
                    model_filepath
                )
            )


            db.add(
                trained_model
            )


        # ====================================================
        # 11. STORE EMPLOYEE PREDICTIONS
        # ====================================================

        for prediction in predictions:

            pred_obj = (
                EmployeePrediction(

                    company_id=(
                        current_user.company_id
                    ),

                    dataset_id=(
                        dataset.id
                    ),

                    employee_id=str(
                        prediction.get(
                            "employee_id",
                            ""
                        )
                    ),

                    department=str(
                        prediction.get(
                            "department",
                            "General"
                        )
                    ),

                    job_role=str(
                        prediction.get(
                            "job_role",
                            "Employee"
                        )
                    ),

                    monthly_income=float(
                        prediction.get(
                            "monthly_income",
                            0
                        )
                        or 0
                    ),

                    job_satisfaction=int(
                        prediction.get(
                            "job_satisfaction",
                            3
                        )
                        or 3
                    ),

                    overtime=str(
                        prediction.get(
                            "overtime",
                            "No"
                        )
                    ),

                    work_life_balance=int(
                        prediction.get(
                            "work_life_balance",
                            3
                        )
                        or 3
                    ),

                    years_at_company=int(
                        prediction.get(
                            "years_at_company",
                            0
                        )
                        or 0
                    ),

                    distance_from_home=int(
                        prediction.get(
                            "distance_from_home",
                            0
                        )
                        or 0
                    ),

                    raw_data=(
                        prediction.get(
                            "raw_data",
                            {}
                        )
                    ),

                    probability=float(
                        prediction.get(
                            "probability",
                            0
                        )
                        or 0
                    ),

                    risk_level=str(
                        prediction.get(
                            "risk_level",
                            "LOW"
                        )
                    ),

                    top_risk_factors=(
                        prediction.get(
                            "top_risk_factors",
                            []
                        )
                    ),

                    recommendations=(
                        prediction.get(
                            "recommendations",
                            []
                        )
                    )
                )
            )


            db.add(
                pred_obj
            )


        # ====================================================
        # 12. COMMIT EVERYTHING TOGETHER
        # ====================================================

        db.commit()


    except Exception as exc:

        # Roll back database changes if
        # anything failed while saving.

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Models were trained successfully, "
                "but saving results to the database "
                "failed: "
                f"{str(exc)}"
            )
        )


    # ========================================================
    # 13. BEST MODEL METRICS
    # ========================================================

    best_metrics = (
        train_results.get(
            "best_metrics",
            {}
        )
    )


    best_model_name = (
        train_results.get(
            "best_model_name",
            "Unknown"
        )
    )


    quality_warning = (
        train_results.get(
            "model_quality_warning"
        )
    )


    # ========================================================
    # 14. RESPONSE
    # ========================================================

    return {

        "message": (
            f"Successfully trained "
            f"{len(all_results)} ML models. "
            f"Best model: "
            f"{best_model_name}"
        ),

        "best_model_name":
            best_model_name,

        "accuracy":
            best_metrics.get(
                "accuracy",
                0
            ),

        "precision":
            best_metrics.get(
                "precision",
                0
            ),

        "recall":
            best_metrics.get(
                "recall",
                0
            ),

        "f1_score":
            best_metrics.get(
                "f1_score",
                0
            ),

        "roc_auc":
            best_metrics.get(
                "roc_auc",
                0
            ),

        "cv_roc_auc":
            best_metrics.get(
                "cv_roc_auc"
            ),

        "cv_f1_score":
            best_metrics.get(
                "cv_f1_score"
            ),

        "training_prevalence":
            best_metrics.get(
                "training_prevalence"
            ),

        "model_quality_warning":
            quality_warning,

        "dropped_columns":
            train_results.get(
                "dropped_columns",
                []
            ),

        "prediction_count":
            len(
                predictions
            ),

        "models_evaluated":
            all_results
    }


# ============================================================
# GET MODEL METRICS
# ============================================================

@router.get("/metrics")
def get_model_metrics(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # ========================================================
    # GET COMPANY MODELS
    # ========================================================

    models = (
        db.query(TrainedModel)
        .filter(
            TrainedModel.company_id ==
            current_user.company_id
        )
        .all()
    )


    if not models:

        raise HTTPException(
            status_code=404,
            detail=(
                "No models trained yet."
            )
        )


    # ========================================================
    # FIND BEST MODEL
    # ========================================================

    best_model = next(
        (
            model
            for model in models
            if model.is_best
        ),
        models[0]
    )


    # ========================================================
    # MODEL COMPARISON
    # ========================================================

    comparison = []


    for model in models:

        metrics_json = (
            model.metrics_json
            or {}
        )


        comparison.append({

            "model_name":
                model.model_name,

            "is_best":
                bool(
                    model.is_best
                ),

            "accuracy":
                round(
                    float(
                        model.accuracy
                        or 0
                    ),
                    4
                ),

            "precision":
                round(
                    float(
                        model.precision
                        or 0
                    ),
                    4
                ),

            "recall":
                round(
                    float(
                        model.recall
                        or 0
                    ),
                    4
                ),

            "f1_score":
                round(
                    float(
                        model.f1_score
                        or 0
                    ),
                    4
                ),

            "roc_auc":
                round(
                    float(
                        model.roc_auc
                        or 0
                    ),
                    4
                ),

            "cv_roc_auc":
                metrics_json.get(
                    "cv_roc_auc"
                ),

            "cv_f1_score":
                metrics_json.get(
                    "cv_f1_score"
                )
        })


    # ========================================================
    # BEST MODEL EXTRA METRICS
    # ========================================================

    best_metrics_json = (
        best_model.metrics_json
        or {}
    )


    confusion = (
        best_metrics_json.get(
            "confusion_matrix",
            [
                [0, 0],
                [0, 0]
            ]
        )
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "model_id":
            best_model.id,

        "best_model_name":
            best_model.model_name,

        "is_best":
            True,

        "accuracy":
            round(
                float(
                    best_model.accuracy
                    or 0
                ),
                4
            ),

        "precision":
            round(
                float(
                    best_model.precision
                    or 0
                ),
                4
            ),

        "recall":
            round(
                float(
                    best_model.recall
                    or 0
                ),
                4
            ),

        "f1_score":
            round(
                float(
                    best_model.f1_score
                    or 0
                ),
                4
            ),

        "roc_auc":
            round(
                float(
                    best_model.roc_auc
                    or 0
                ),
                4
            ),

        "cv_roc_auc":
            best_metrics_json.get(
                "cv_roc_auc"
            ),

        "cv_f1_score":
            best_metrics_json.get(
                "cv_f1_score"
            ),

        "training_prevalence":
            best_metrics_json.get(
                "training_prevalence"
            ),

        "confusion_matrix":
            confusion,

        "feature_importances":
            (
                best_model
                .feature_importance_json
                or []
            ),

        "all_models_comparison":
            comparison
    }


# ============================================================
# PIPELINE INFORMATION
# ============================================================

@router.get("/pipeline-info")
def get_pipeline_info(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # Authentication is intentionally
    # required for this endpoint.

    return (
        get_pipeline_implementation_details()
    )