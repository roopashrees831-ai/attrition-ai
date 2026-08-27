from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True, nullable=False)
    industry = Column(String, default="Technology")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="company", cascade="all, delete-orphan")
    models = relationship("TrainedModel", back_populates="company", cascade="all, delete-orphan")
    predictions = relationship("EmployeePrediction", back_populates="company", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="users")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    target_col = Column(String, default="Attrition")
    column_mapping = Column(JSON, nullable=True) # store dict of original -> mapped name
    data_summary = Column(JSON, nullable=True) # row count, cols, missing values count, duplicates
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="datasets")
    models = relationship("TrainedModel", back_populates="dataset", cascade="all, delete-orphan")
    predictions = relationship("EmployeePrediction", back_populates="dataset", cascade="all, delete-orphan")

class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    model_name = Column(String, nullable=False) # e.g. Random Forest
    is_best = Column(Boolean, default=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    metrics_json = Column(JSON, nullable=True) # confusion matrix, comparison table
    feature_importance_json = Column(JSON, nullable=True) # feature rankings
    trained_filepath = Column(String, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="models")
    dataset = relationship("Dataset", back_populates="models")

class EmployeePrediction(Base):
    __tablename__ = "employee_predictions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    employee_id = Column(String, index=True, nullable=False)
    department = Column(String, default="General")
    job_role = Column(String, default="Employee")
    monthly_income = Column(Float, default=0.0)
    job_satisfaction = Column(Integer, default=3)
    overtime = Column(String, default="No")
    work_life_balance = Column(Integer, default=3)
    years_at_company = Column(Integer, default=1)
    distance_from_home = Column(Integer, default=5)
    raw_data = Column(JSON, nullable=True) # stores full row dictionary
    probability = Column(Float, nullable=False) # 0.0 to 1.0 (e.g. 0.82)
    risk_level = Column(String, nullable=False) # HIGH, MEDIUM, LOW
    top_risk_factors = Column(JSON, nullable=True) # list of risk driver descriptions
    recommendations = Column(JSON, nullable=True) # list of AI retention action items
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="predictions")
    dataset = relationship("Dataset", back_populates="predictions")
