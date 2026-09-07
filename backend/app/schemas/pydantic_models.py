from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


# ============================================================
# AUTHENTICATION
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class LoginRequest(BaseModel):
    company_name: str
    email: str
    password: str


class DemoLoginRequest(BaseModel):
    company_name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    company_name: str
    email: str
    recovery_code: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class AddHREmailRequest(BaseModel):
    new_email: str
    authorization_code: str


class VerifyHREmailRequest(BaseModel):
    email: str
    verification_code: str


# ============================================================
# COMPANY
# ============================================================

class CompanyOut(BaseModel):
    id: int
    company_name: str
    industry: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# USER
# ============================================================

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    company_id: int
    company_name: str

    class Config:
        from_attributes = True


# ============================================================
# DATASET
# ============================================================

class ColumnMappingRequest(BaseModel):
    dataset_id: int
    target_column: str
    column_mapping: Dict[str, str]


# ============================================================
# MODEL TRAINING
# ============================================================

class ModelTrainRequest(BaseModel):
    dataset_id: int


# ============================================================
# MODEL METRICS
# ============================================================

class ModelMetricsOut(BaseModel):
    model_id: int
    model_name: str
    is_best: bool
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    feature_importances: List[Dict[str, Any]]
    all_models_comparison: List[Dict[str, Any]]


# ============================================================
# EMPLOYEE PREDICTION
# ============================================================

class EmployeePredictionOut(BaseModel):
    id: int
    employee_id: str
    department: str
    job_role: str
    monthly_income: float
    job_satisfaction: int
    overtime: str
    work_life_balance: int
    years_at_company: int
    distance_from_home: int
    probability: float
    risk_level: str
    top_risk_factors: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    raw_data: Optional[Dict[str, Any]] = None


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

class DashboardSummaryOut(BaseModel):
    total_employees: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    attrition_rate: float
    best_model_name: str
    best_model_accuracy: Optional[float] = None
    risk_distribution: List[Dict[str, Any]]
    department_attrition: List[Dict[str, Any]]
    job_satisfaction_attrition: List[Dict[str, Any]]
    workload_attrition: List[Dict[str, Any]]
    top_risk_factors: List[Dict[str, Any]]


# ============================================================
# AI INSIGHTS
# ============================================================

class AIInsightCard(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    detail: str
    stat_highlight: str
    recommendation: str