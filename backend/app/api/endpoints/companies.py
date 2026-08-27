from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, Company, Dataset, TrainedModel, EmployeePrediction
from app.security import get_current_user

router = APIRouter(prefix="/companies", tags=["Company Settings"])

@router.get("/current")
def get_current_company_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    dataset = db.query(Dataset).filter(
        Dataset.company_id == company.id,
        Dataset.is_active == True
    ).first()

    best_model = db.query(TrainedModel).filter(
        TrainedModel.company_id == company.id,
        TrainedModel.is_best == True
    ).first()

    preds = db.query(EmployeePrediction).filter(EmployeePrediction.company_id == company.id).all()
    total_emp = len(preds)
    high_risk = sum(1 for p in preds if p.risk_level == "HIGH")

    return {
        "id": company.id,
        "company_name": company.company_name,
        "industry": company.industry,
        "created_at": company.created_at,
        "active_dataset": dataset.filename if dataset else "None",
        "total_employees": total_emp,
        "high_risk_employees": high_risk,
        "attrition_rate": round((high_risk / total_emp * 100), 1) if total_emp > 0 else 0,
        "active_model": best_model.model_name if best_model else "Not Trained",
        "last_trained_at": best_model.trained_at if best_model else None,
        "model_accuracy": round(best_model.accuracy * 100, 1) if best_model else None
    }
