import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, Dataset, TrainedModel, EmployeePrediction
from app.security import get_current_user
from app.schemas.pydantic_models import ModelTrainRequest
from app.services.ml_engine import preprocess_and_train_models, batch_predict
from app.config import settings

router = APIRouter(prefix="/models", tags=["Models"])

@router.post("/train")
def train_model(
    req: ModelTrainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == req.dataset_id,
        Dataset.company_id == current_user.company_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail=f"Dataset file at {dataset.filepath} missing.")

    try:
        df = pd.read_csv(dataset.filepath)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read dataset: {str(e)}")

    company_model_dir = os.path.join(settings.MODEL_DIR, f"company_{current_user.company_id}")

    try:
        train_results = preprocess_and_train_models(
            df=df,
            target_col=dataset.target_col or "Attrition",
            column_mapping=dataset.column_mapping or {},
            model_save_dir=company_model_dir
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

    # Clear previous models & predictions for this dataset
    db.query(TrainedModel).filter(TrainedModel.company_id == current_user.company_id).delete()
    db.query(EmployeePrediction).filter(EmployeePrediction.company_id == current_user.company_id).delete()
    db.commit()

    # Store new trained model results
    stored_models = []
    for res in train_results["all_results"]:
        t_model = TrainedModel(
            company_id=current_user.company_id,
            dataset_id=dataset.id,
            model_name=res["model_name"],
            is_best=res["is_best"],
            accuracy=res["accuracy"],
            precision=res["precision"],
            recall=res["recall"],
            f1_score=res["f1_score"],
            roc_auc=res["roc_auc"],
            metrics_json={
                "confusion_matrix": res["confusion_matrix"],
                "all_results": train_results["all_results"]
            },
            feature_importance_json=res["feature_importances"],
            trained_filepath=train_results["best_model_path"]
        )
        db.add(t_model)
        stored_models.append(t_model)
    db.commit()

    # Run batch predictions on full dataset using best model
    preds = batch_predict(
        df=df,
        model_path=train_results["best_model_path"],
        column_mapping=dataset.column_mapping or {}
    )

    for p in preds:
        pred_obj = EmployeePrediction(
            company_id=current_user.company_id,
            dataset_id=dataset.id,
            employee_id=p["employee_id"],
            department=p["department"],
            job_role=p["job_role"],
            monthly_income=p["monthly_income"],
            job_satisfaction=p["job_satisfaction"],
            overtime=p["overtime"],
            work_life_balance=p["work_life_balance"],
            years_at_company=p["years_at_company"],
            distance_from_home=p["distance_from_home"],
            raw_data=p["raw_data"],
            probability=p["probability"],
            risk_level=p["risk_level"],
            top_risk_factors=p["top_risk_factors"],
            recommendations=p["recommendations"]
        )
        db.add(pred_obj)

    db.commit()

    best_m = train_results["best_metrics"]
    return {
        "message": f"Successfully trained 3 ML models. Best model: {train_results['best_model_name']}",
        "best_model_name": train_results["best_model_name"],
        "accuracy": best_m["accuracy"],
        "precision": best_m["precision"],
        "recall": best_m["recall"],
        "f1_score": best_m["f1_score"],
        "roc_auc": best_m["roc_auc"],
        "models_evaluated": train_results["all_results"]
    }

@router.get("/metrics")
def get_model_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    models = db.query(TrainedModel).filter(
        TrainedModel.company_id == current_user.company_id
    ).all()

    if not models:
        raise HTTPException(status_code=404, detail="No models trained yet.")

    best_model = next((m for m in models if m.is_best), models[0])

    comparison = []
    for m in models:
        comparison.append({
            "model_name": m.model_name,
            "is_best": m.is_best,
            "accuracy": round(m.accuracy, 4),
            "precision": round(m.precision, 4),
            "recall": round(m.recall, 4),
            "f1_score": round(m.f1_score, 4),
            "roc_auc": round(m.roc_auc, 4)
        })

    metrics_json = best_model.metrics_json or {}
    cm = metrics_json.get("confusion_matrix", [[0, 0], [0, 0]])

    return {
        "model_id": best_model.id,
        "best_model_name": best_model.model_name,
        "is_best": True,
        "accuracy": round(best_model.accuracy, 4),
        "precision": round(best_model.precision, 4),
        "recall": round(best_model.recall, 4),
        "f1_score": round(best_model.f1_score, 4),
        "roc_auc": round(best_model.roc_auc, 4),
        "confusion_matrix": cm,
        "feature_importances": best_model.feature_importance_json or [],
        "all_models_comparison": comparison
    }
