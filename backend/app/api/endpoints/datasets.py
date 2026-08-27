import os
import shutil
import pandas as pd
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, Dataset
from app.security import get_current_user
from app.schemas.pydantic_models import ColumnMappingRequest
from app.services.ml_engine import detect_column_mappings
from app.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"company_{current_user.company_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="Uploaded dataset is empty.")

    # Detect target column & mapped columns
    suggested_target, col_mapping = detect_column_mappings(df)

    data_summary = {
        "rows": len(df),
        "cols": len(df.columns),
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "columns": list(df.columns),
        "target_col": suggested_target,
        "sample": df.head(5).to_dict(orient="records")
    }

    # Deactivate older active dataset for this company
    db.query(Dataset).filter(
        Dataset.company_id == current_user.company_id,
        Dataset.is_active == True
    ).update({"is_active": False})

    dataset = Dataset(
        company_id=current_user.company_id,
        filename=file.filename,
        filepath=file_path,
        row_count=len(df),
        col_count=len(df.columns),
        target_col=suggested_target,
        column_mapping=col_mapping,
        data_summary=data_summary,
        is_active=True
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return {
        "message": "Dataset uploaded and analyzed successfully.",
        "dataset_id": dataset.id,
        "filename": dataset.filename,
        "summary": data_summary,
        "suggested_target": suggested_target,
        "suggested_mapping": col_mapping
    }

@router.post("/map-columns")
def map_columns(
    req: ColumnMappingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == req.dataset_id,
        Dataset.company_id == current_user.company_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset.target_col = req.target_column
    dataset.column_mapping = req.column_mapping

    summary = dataset.data_summary or {}
    summary["target_col"] = req.target_column
    dataset.data_summary = summary

    db.commit()
    return {"message": "Column mapping updated successfully.", "dataset_id": dataset.id}

@router.get("/active")
def get_active_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(
        Dataset.company_id == current_user.company_id,
        Dataset.is_active == True
    ).first()

    if not dataset:
        # Fallback to any latest dataset
        dataset = db.query(Dataset).filter(
            Dataset.company_id == current_user.company_id
        ).order_by(Dataset.id.desc()).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="No dataset uploaded yet.")

    return {
        "dataset_id": dataset.id,
        "filename": dataset.filename,
        "row_count": dataset.row_count,
        "col_count": dataset.col_count,
        "target_col": dataset.target_col,
        "column_mapping": dataset.column_mapping or {},
        "data_summary": dataset.data_summary or {},
        "uploaded_at": dataset.uploaded_at
    }
